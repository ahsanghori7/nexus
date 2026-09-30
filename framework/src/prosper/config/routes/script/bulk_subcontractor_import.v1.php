<?php

use Core\Config;
use Core\Data\Shape;
use Core\Data\Collection;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Service\UserMiddleware;
use Core\Service\Manager;

$phpSpreadsheet = [
    'csv'  => 'PhpOffice\PhpSpreadsheet\Reader\Csv',
    'xlsx' => 'PhpOffice\PhpSpreadsheet\Reader\Xlsx',
];

return [
    "rules" => [],
    "middleware" => [],
    "type" => "cli",
    "actions" => [
        [
            "key" => "import",
            "middleware" => [
                function ($a) use ($argv) {
                    echo "=== SUPPLY CHAIN IMPORT STARTING ===\n";

                    $file = $argv[3] ?? null;
                    $main_contractor_id = $argv[4] ?? 0;

                    if (!$main_contractor_id) {
                        die("Error: Please specify the main contractor account ID\n");
                    }

                    if (!$file || !file_exists($file)) {
                        die("Error: The specified file '$file' was not found\n");
                    }

                    $a->set("main_contractor_id", $main_contractor_id);
                    $a->set("import_file", $file);

                    echo "Import setup complete\n";
                },

                // Load main contractor account
                AccountMiddleware::loadById("main_contractor_id"),

                function ($a) {
                    $account = $a->get("account");
                    if (!$account) {
                        die("Error: Main contractor account not found\n");
                    }
                },

                function ($a) use ($phpSpreadsheet) {
                    $file = $a->get("import_file");
                    $main_contractor = $a->get("account");
                    $main_contractor_id = $a->get("main_contractor_id");

                    // Check if account was loaded properly
                    $account_data = $main_contractor ? $main_contractor->toArray() : null;
                    $main_contractor_account_id = $main_contractor->get('id') ?? null;
                    if (!$main_contractor_account_id) {
                        die("Error: Main contractor account not exists\n");
                    }

                    $import_data = [];
                    $errors = [];
                    $success_count = 0;
                    $error_count = 0;

                    // Parse file based on extension
                    $file_extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));

                    try {
                        switch ($file_extension) {
                            case 'json':
                                $import_data = json_decode(file_get_contents($file), true);
                                break;
                            case 'csv':
                                $import_data = parseCsvFile($file);
                                break;
                            case 'xlsx':
                                if (isset($phpSpreadsheet[$file_extension])) {
                                    $import_data = parseExcelFile($file, $phpSpreadsheet[$file_extension]);
                                } else {
                                    die("Error: Excel file format not supported: $file_extension\n");
                                }
                                break;
                            default:
                                die("Error: Unsupported file format: $file_extension\n");
                        }

                        if (empty($import_data)) {
                            die("Error: No data found in file or file is empty\n");
                        }

                        // Validate headers
                        $header_validation = validateHeaders($import_data[0]);
                        if (!empty($header_validation['missing'])) {
                            die("Error: Missing required columns: " . implode(", ", $header_validation['missing']) . "\n");
                        }

                        // Load account types, subscriptions, and user types using middleware
                        AccountMiddleware::loadTypes()($a);
                        AccountMiddleware::loadSubscriptions()($a);
                        UserMiddleware::loadTypes("user_types")($a);

                        // Get account type ID
                        $account_types = $a->getCollection("account_types");
                        $subcontractor_type = $account_types->filterByField("label", "external_subcontractor")->first();
                        if (!$subcontractor_type) {
                            die("Error: Could not find external_subcontractor account type\n");
                        }

                        // Get subscription ID
                        $subscriptions = $a->getCollection("account_subscriptions");
                        $subcontractor_subscription = $subscriptions->filterByField("uid", "external_subcontractor")->first();
                        if (!$subcontractor_subscription) {
                            die("Error: Could not find external_subcontractor subscription\n");
                        }
                        $subcontractor_subscription_id = $subcontractor_subscription->get('id');

                        // Get user type ID
                        $user_types = $a->getCollection("user_types");
                        $account_holder_type = $user_types->filterByField("label", "account_holder")->first();
                        if (!$account_holder_type) {
                            die("Error: Could not find account_holder user type\n");
                        }
                        $account_holder_type_id = $account_holder_type->get('id');

                        echo "Starting import of " . count($import_data) . " records...\n\n";

                        // Process each record
                        foreach ($import_data as $index => $record) {
                            $record_number = $index + 1;
                            echo "Processing record $record_number: {$record['company_name']}...";

                            try {
                                // Validate required fields
                                $validation_errors = validateRequiredFields($record);
                                if (!empty($validation_errors)) {
                                    throw new Exception("Required field validation failed: " . implode(", ", $validation_errors));
                                }

                                // Check if account already exists
                                if (accountExists($record['company_name'], $record['email'])) {
                                    throw new Exception("Account with company name '{$record['company_name']}' or email '{$record['email']}' already exists");
                                }

                                // Create external subcontractor account with supply chain link
                                $result = createExternalSubcontractor($record, $main_contractor_id, $account_holder_type_id, $subcontractor_subscription_id);

                                if ($result) {
                                    $account_id = $result['account_id'];
                                    $user_id = $result['user_id'];

                                    createAccountUserMapping($main_contractor_id, $user_id, $record);

                                    // Handle trades and locations
                                    handleAttributeMapping($record, $account_id, $main_contractor_id);

                                    $success_count++;
                                    echo "SUCCESS\n";
                                } else {
                                    throw new Exception("Failed to create external subcontractor");
                                }

                            } catch (Exception $e) {
                                $company_name = $record['company_name'] ?? 'Unknown';
                                $error_msg = "Record $record_number ($company_name): " . $e->getMessage();
                                $errors[] = $error_msg;
                                $error_count++;
                                echo "FAILED\n";
                            }
                        }

                    } catch (Exception $e) {
                        die("Fatal Error: " . $e->getMessage() . "\n");
                    }

                    // Final summary
                    echo "\n=== IMPORT SUMMARY ===\n";
                    echo "Total Records: " . count($import_data) . "\n";
                    echo "Successfully Imported: $success_count\n";
                    echo "Failed: $error_count\n\n";

                    if (!empty($errors)) {
                        echo "=== ERRORS ===\n";
                        foreach ($errors as $error) {
                            echo "• $error\n";
                        }
                    }

                    die("\nImport process completed.\n");
                }
            ]
        ]
    ]
];

// Helper Functions

function validateRequiredFields($record) {
    $errors = [];

    // Required fields: company_name, email, first_name
    if (empty($record['company_name'])) {
        $errors[] = "Company name is required";
    }

    if (empty($record['email'])) {
        $errors[] = "Email is required";
    } elseif (!filter_var($record['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Invalid email format";
    }

    if (empty($record['first_name'])) {
        $errors[] = "First name is required";
    }

    return $errors;
}

function validateHeaders($sample_record) {
    $required_headers = ['company_name', 'email', 'first_name'];
    $optional_headers = ['primary_trade','primary_location','phone_number', 'last_name', 'company_registration_number', 'address'];
    $all_valid_headers = array_merge($required_headers, $optional_headers);

    $file_headers = array_keys($sample_record);
    $missing_required = [];
    $missing_optional = [];
    $invalid_headers = [];

    // Check for missing required headers
    foreach ($required_headers as $required) {
        if (!in_array($required, $file_headers)) {
            $missing_required[] = $required;
        }
    }

    // Check for missing optional headers
    foreach ($optional_headers as $optional) {
        if (!in_array($optional, $file_headers)) {
            $missing_optional[] = $optional;
        }
    }

    // Check for invalid headers
    foreach ($file_headers as $header) {
        if (!in_array($header, $all_valid_headers)) {
            $invalid_headers[] = $header;
        }
    }

    return [
        'missing' => $missing_required,
        'warnings' => $missing_optional,
        'invalid' => $invalid_headers
    ];
}

function accountExists($company_name, $email) {
    try {
        $accountByName = Manager::getService('account')->fetch("account", ['name' => $company_name])->getCollection('data');
        if ($accountByName->count() > 0) {
            return true;
        }

        $accountByEmail = Manager::getService('account')->fetch("account", ['email' => $email])->getCollection('data');
        if ($accountByEmail->count() > 0) {
            return true;
        }

        return false;
    } catch (Exception $e) {
        return false;
    }
}

function createExternalSubcontractor($record, $parent_id, $user_type_id, $subscription_id) {
    try {
        // Prepare account data
        $account_data = [
            'name' => $record['company_name'],
            'email' => $record['email'],
            'phone' => $record['phone_number'] ?? null,
            'address' => $record['address'] ?? null,
            'city' => $record['city'] ?? null,
            'province' => $record['province'] ?? null,
            'postal_code' => $record['postal_code'] ?? null,
            'country' => $record['country'] ?? null,
            'registration_number' => $record['company_registration_number'] ?? null,
            'user' => [
                'firstname' => $record['first_name'],
                'lastname' => $record['last_name'] ?? '',
                'email' => $record['email'],
                'password' => $record['email'],
                'type_id' => $user_type_id,
                'status' => 1
            ]
        ];

        $shape = new Shape(['data' => $account_data]);
        $response = Manager::getService('account')->write("account/$parent_id/supply_chain/external", $shape);

        // Parse the JSON content from response
        $content = $response->get('content');
        $http_code = $response->get('info.http_code');

        if ($http_code == 200) {
            $response_data = json_decode($content, true);

            if (isset($response_data['data']['id']) && isset($response_data['data']['user_id'])) {
                $account_id = $response_data['data']['id'];
                $user_id = $response_data['data']['user_id'];

                // Update membership to use proper external_subcontractor subscription
                if ($subscription_id) {
                    updateMembershipSubscription($account_id, $subscription_id);
                }

                // Create actual supply chain record
                $supply_chain_created = createActualSupplyChainRecord($parent_id, $account_id);

                return [
                    'account_id' => $account_id,
                    'user_id' => $user_id,
                    'supply_chain_created' => $supply_chain_created
                ];
            }
        }

        return false;

    } catch (Exception $e) {
        return false;
    }
}

function createActualSupplyChainRecord($parent_id, $child_id) {
    try {
        $supply_chain_data = [
            'id' => (int)$child_id
        ];

        $shape = new Shape(['data' => $supply_chain_data]);
        $response = Manager::getService('account_v2')->write("account/$parent_id/supply-chain", $shape);

        $content = $response->get('content');
        $http_code = $response->get('info.http_code');

        if ($http_code == 204 || $http_code == 200) {
            return true;
        }

        return false;

    } catch (Exception $e) {
        return false;
    }
}

function updateMembershipSubscription($account_id, $subscription_id) {
    try {
        $membership_data = [
            'subscription_id' => $subscription_id
        ];

        $shape = new Shape([
            'data' => $membership_data,
        ]);
        $response = Manager::getService('account')->update("account/$account_id/membership", $shape);

        $content = $response->get('content');
        $http_code = $response->get('info.http_code');

        if ($http_code == 200 || $http_code == 204) {
            return true;
        } else {
            return false;
        }

    } catch (Exception $e) {
        return false;
    }
}

function createAccountUserMapping($account_id, $user_id, $record) {
    try {
        $mapping_data = [
            'mapping_type' => 'supply_chain',
            'firstname' => $record['first_name'] ?? '',
            'lastname' => $record['last_name'] ?? '',
            'contact_number' => $record['phone_number'] ?? '',
        ];

        $shape = new Shape(['data' => $mapping_data]);
        $response = Manager::getService('account_v2')->write("account/$account_id/supply-chain/$account_id/user/$user_id", $shape);

        $content = $response->get('content');
        $http_code = $response->get('info.http_code');

        if ($http_code == 200 || $http_code == 201 || $http_code == 204) {
            return true;
        }

        return false;

    } catch (Exception $e) {
        return false;
    }
}

function handleAttributeMapping($record, $account_id, $main_contractor_id) {
    $results = [];
    $has_valid_location = false;

    // Handle trades
    if (!empty($record['trades'])) {
        $trade_ids = [];
        $trades = is_array($record['trades']) ? $record['trades'] : explode(',', $record['trades']);

        foreach ($trades as $trade_name) {
            $trade_name = trim($trade_name);
            $trade_id = findAttributeByName($trade_name);
            if ($trade_id) {
                $trade_ids[] = $trade_id;
            }
        }
        if ($trade_ids) {
            createAttributeMapping($main_contractor_id, $account_id, $trade_ids, 'trade');
        }
    }

    // Handle locations
    if (!empty($record['locations'])) {
        $location_ids = [];
        $locations = is_array($record['locations']) ? $record['locations'] : explode(',', $record['locations']);

        foreach ($locations as $location_name) {
            $location_name = trim($location_name);
            $location_id = findAttributeByName($location_name);
            if($location_id) {
                $location_ids[] = $location_id;
            }

            if ($location_ids) {
                createAttributeMapping($main_contractor_id, $account_id, $location_ids, 'location');
                $has_valid_location = true;
            }
        }
    }

    // Default to London if no valid locations found
    if (!$has_valid_location) {
        $london_id = findAttributeByName('London');
        if ($london_id) {
            createAttributeMapping($main_contractor_id, $account_id, [$london_id], 'location');
        }
    }

    return $results;
}

function findAttributeByName($name) {
    try {
        $response = Manager::getService('account_v2')->fetch("attribute", ['label' => $name])->getCollection('data');
        if ($response && $response->count() > 0) {
            return $response->first()->get('id');
        }
        return null;

    } catch (Exception $e) {
        return null;
    }
}

function createAttributeMapping($account_id, $group_id, array $attribute_ids, $type) {
    try {
        if($type == 'trade'){
            $mapping_data = [
                'trades' => array_map('intval', $attribute_ids)
            ];
        } else {
            $mapping_data = [
                'locations' => array_map('intval', $attribute_ids)
            ];
        }
        $shape = new Shape(['data' => $mapping_data]);
        $response = Manager::getService('account_v2')->write("account/$account_id/attribute/$group_id", $shape);

        $content = $response->get('content');
        $http_code = $response->get('info.http_code');

        if ($http_code == 200 || $http_code == 201 || $http_code == 204) {
            return true;
        }

        return false;

    } catch (Exception $e) {
        return false;
    }
}

function parseCsvFile($file) {
    $data = [];
    $headers = [];

    if (($handle = fopen($file, "r")) !== FALSE) {
        $row = 0;
        while (($csv_data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            if ($row == 0) {
                // First row contains headers
                $headers = array_map('strtolower', $csv_data);
                $headers = array_map(function($header) {
                    return str_replace(' ', '_', trim($header ?? ''));
                }, $headers);
            } else {
                // Map data to headers
                $record = [];
                foreach ($csv_data as $index => $value) {
                    if (isset($headers[$index])) {
                        $record[$headers[$index]] = trim($value ?? '');
                    }
                }
                $data[] = $record;
            }
            $row++;
        }
        fclose($handle);
    }

    return $data;
}

function parseExcelFile($file, $readerClass) {
    $data = [];

    try {
        $reader = new $readerClass();
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($file);
        $sheet = $spreadsheet->getSheet(0);
        $rows = $sheet->toArray();

        if (empty($rows)) {
            return $data;
        }

        // First row contains headers
        $headers = array_map('strtolower', $rows[0]);
        $headers = array_map(function($header) {
            return str_replace(' ', '_', trim($header ?? ''));
        }, $headers);

        // Process data rows
        for ($i = 1; $i < count($rows); $i++) {
            $record = [];
            foreach ($rows[$i] as $index => $value) {
                if (isset($headers[$index])) {
                    $record[$headers[$index]] = trim($value ?? '');
                }
            }
            if (!empty(array_filter($record))) {
                $data[] = $record;
            }
        }

    } catch (Exception $e) {
        die("Failed to parse Excel file: " . $e->getMessage() . "\n");
    }

    return $data;
}
