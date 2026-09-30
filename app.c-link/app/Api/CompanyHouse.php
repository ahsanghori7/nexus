<?php

namespace App\Api;

use App\Api\Client;
use App\Api\Account;
use App\Api\V2\Account as AccountV2;
use App\core\Request;
use App\Models\User;
use App\Api\Client\Response\JsonResponse;

class CompanyHouse extends Client
{
    const API_CONFIG_KEY = "company_house";
    const COMPANY_HOUSE_SEARCH_LIMIT = 100;

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "searchByRegNumber" => [
                "type" => 'GET',
                "requires_session" => true
            ],
            "searchByName" => [
                "type" => 'GET',
                "requires_session" => true
            ],
            "searchByCompanyName" => [
                "type" => 'GET'
            ]
        ]
    ];

    /**
     * @return array|array[]
     */
    public static function getSecurity()
    {
        return self::$security;
    }

    /**
     * @param string $path
     * @param string $request
     * @return mixed
     * @throws Client\Response\JsonException
     */
    public static function makeRequest(string $path, string $request = '')
    {
        $key = self::getConfig("api_key");
        if (!$path) {
            self::throwJsonException("Bad Request, missing path");
        }

        $res = self::getRequest($path)->setOptions([CURLOPT_USERPWD => $key . ':']);
        if($request) {
            $res->setParams(["q" => $request, 'items_per_page' => self::COMPANY_HOUSE_SEARCH_LIMIT]);
        }

        return $res->call()->json();
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws Client\Response\JsonException
     */
    public static function searchByCompanyName(Request $request): JsonResponse
    {
        $results = self::makeRequest('/search/companies', $request->query("name"));
        $companies = [];
        if ($results) {
            $companies = array_map(function ($company){
                $title = $company['title'] ?? $company['matches']['matches']['title'] ?? null;
                if($title){
                    return [
                        'name' => $company['title'],
                        'number' => $company['company_number'],
                        'address' => $company['address'] ?? [],
                    ];
                }
            }, $results["items"]);
            $companies = array_values(array_filter($companies));
        }

        return self::jsonResponse([
            "found" =>  !empty($companies),
            "companies" => $companies,
        ], 200);
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     * @throws Client\Response\JsonException
     * @throws Exception
     */
    public static function searchByName(Request $request, User $user): JsonResponse
    {
        try {
            $subContractorType = $request->query("subcontractorType");
            $aid               = $user->getAccountId();
            $localAccounts     = Account::get("account/all");
            $companies         = [];

            if ($subContractorType === 'uk') {
                $results = self::makeRequest('/search/companies', $request->query("name"));
                if ($results) {
                    $companies = array_values(array_filter(array_map(
                        fn($company) => self::mapUkCompany($company, $localAccounts, $aid),
                        $results["items"]
                    )));
                }
            } elseif ($subContractorType === 'non-uk') {
                $name = trim($request->query("name") ?? '');

                if (empty($name)) {
                    return self::jsonResponse(["error" => "Company name is required"], 400);
                }

                $companies = [self::mapNonUkCompany($name, $localAccounts, $aid)];
            }

            return self::jsonResponse([
                "found"     => !empty($companies),
                "companies" => $companies,
            ], 200);
        } catch (\Throwable $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 500);
        }
    }

    /**
     * @param array $localAccounts
     * @param string $name
     * @return array|null
     */
    private static function findAccountByName(array $localAccounts, string $name): ?array
    {
        $match = array_filter($localAccounts, fn($v) => strtolower($v['name']) === strtolower($name));
        return array_shift($match) ?: null;
    }

    /**
     * @param array $company
     * @param array $localAccounts
     * @param int $aid
     * @return array|null
     */
    private static function mapUkCompany(array $company, array $localAccounts, int $aid): ?array
    {
        $title = $company['title'] ?? $company['matches']['matches']['title'] ?? null;
        if ($title === null) {
            return null;
        }

        $account    = self::findAccountByName($localAccounts, $title);
        $hasAccount = $account !== null;

        $data = [
            'name'            => $title,
            'number'          => $company['company_number'],
            'account_match'     => $hasAccount,
            'address'         => $company['address'] ?? [],
            'in_supply_chain' => $hasAccount ? self::inSupplyChain($aid, $account['id']) : false,
        ];

        if ($hasAccount) {
            $data = array_merge($data, self::getAutofillData($account));
        }

        return $data;
    }

    /**
     * @param string $name
     * @param array $localAccounts
     * @param int $aid
     * @return array
     */
    private static function mapNonUkCompany(string $name, array $localAccounts, int $aid): array
    {
        $account    = self::findAccountByName($localAccounts, $name);
        $hasAccount = $account !== null;

        $data = [
            'name'            => $name,
            'number'          => $account['reg_number'] ?? '',
            'address'         => $account['address'] ?? [],
            'account_match'     => $hasAccount,
            'in_supply_chain' => $hasAccount ? self::inSupplyChain($aid, $account['id']) : false,
        ];

        if ($hasAccount) {
            $data = array_merge($data, self::getAutofillData($account));
        }

        return $data;
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     * @throws Client\Response\JsonException
     * @throws Exception
     */
    public static function searchByRegNumber(Request $request, User $user): jsonResponse
    {
        $companyId = $request->getQueryValue("number");
        $results = self::makeRequest("/company/$companyId");

        $aid = $user->getAccountId();
        $localAccounts = Account::get("account/all");
        $accountsFound = array_filter($localAccounts, function ($v) use ($results) {
            return preg_replace('/\s+/', '', strtolower($v['name'])) === preg_replace('/\s+/', '', strtolower($results['company_name']));
        }, ARRAY_FILTER_USE_BOTH);

        $account = array_shift($accountsFound);
        $accountMatch = !is_null($account);
        $name = $results["company_name"] ?? "";
        $data = [
            'name' => $name,
            "account_match" => $accountMatch,
            'number' => !empty($name) ? $companyId : "",
            'found' => !empty($name),
            'address' => $results['registered_office_address'] ?? [],
            'in_supply_chain' => isset($account['id']) ? self::inSupplyChain($aid, $account['id']) : false
        ];
        if ($accountMatch) {
            $data = array_merge($data, self::getAutofillData($account));
        }

        return self::jsonResponse($data, 200);
    }

    /**
     * @param string $suffix
     * @return string
     */
    public static function getBaseUrl(string $suffix = ""): string
    {
        $conf = self::getConfig();
        if ($suffix === "search") {
            return $conf["search_url"] ?? "";
        }
        return $conf["url"] . $suffix;
    }

    /**
     * @param int $aid
     * @param int $supplyChainAccountId
     * @return bool
     */
    public static function inSupplyChain(int $aid, int $supplyChainAccountId): bool
    {
        $supplyChain = AccountV2::get(sprintf("account/%s/supply-chain/%s", $aid, $supplyChainAccountId));
        return !empty($supplyChain);
    }

    /**
     * Only return the fields React used for contact prefill.
     *
     * @param array $account
     * @return array<string, string>
     */
    public static function getAutofillData(array $account): array
    {
        $contactName = '';
        $email = '';
        $phone = strval($account['mobile'] ?? '');

        $completeDataAccount = Account::getAccount((int) ($account['id'] ?? 0));
        if (!empty($completeDataAccount['users'])) {
            $user = array_shift($completeDataAccount['users']);
            $email = strval($user['email'] ?? '');
            $contactName = self::getContactName($user);
        }

        return [
            'contact_name' => $contactName,
            'email' => $email,
            'phone' => $phone,
        ];
    }

    /**
     * @param array $user
     * @return string
     */
    private static function getContactName(array $user): string
    {
        $contactName = trim(strval($user['display_name'] ?? ''));
        if ($contactName !== '') {
            return $contactName;
        }

        return trim(sprintf(
            '%s %s',
            strval($user['firstname'] ?? ''),
            strval($user['lastname'] ?? '')
        ));
    }

}
