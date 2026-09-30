<?php

namespace Core\Service;

use Aws\Ssm\SsmClient;

class SSMService extends RestService
{
    /**
     * @var SSMClient
     */
    protected SSMClient $ssm_client;

    /**
     * @return SSMClient
     */
    public function getClient(): SSMClient
    {
        if ( !isset($this->ssm_client) ) {
            $this->ssm_client = new SsmClient([
                'version'   => $this->get("version"),
                'region'    => $this->get("region"),
                'credentials' => [
                    'key'    => $this->get("access_key"),
                    'secret' => $this->get("secret_key"),
                ]
            ]);
        }
        return $this->ssm_client;
    }

    /**
     * Retrieve a parameter from SSM Parameter Store
     *
     * @param string $name
     * @param bool   $withDecryption
     * @return string|null
     */
    public function getParameter(string $name, bool $withDecryption = true): ?string
    {
        try {
            $result = $this->getClient()->getParameter([
                'Name'           => $name,
                'WithDecryption' => $withDecryption,
            ]);
            return $result['Parameter']['Value'] ?? null;
        } catch (\Exception $e) {
            error_log('SSM getParameter failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Retrieve multiple parameters by path or names
     *
     * @param array|string $names
     * @param bool $withDecryption
     * @return array
     */
    public function getParameters(array|string $names, bool $withDecryption = true, bool $fullKeyPath = true): array
    {
        try {
            if (is_array($names)) {
                // Fetch specific parameters by name
                $result = $this->getClient()->getParameters([
                    'Names'          => $names,
                    'WithDecryption' => $withDecryption,
                ]);
            } else {
                // Fetch all parameters under a given path
                $result = $this->getClient()->getParametersByPath([
                    'Path'           => $names,
                    'Recursive'      => true,
                    'WithDecryption' => $withDecryption,
                ]);
            }

            $parameters = [];
            foreach ($result['Parameters'] as $param) {
                $param['Name'] = str_replace($names . '/', '', $param['Name']);
                if(!$fullKeyPath) {
                    $param['Name'] = basename($param['Name']);
                }
                $parameters[$param['Name']] = $param['Value'];
            }

            return $parameters;

        } catch (\Exception $e) {
            error_log('SSM getParameters failed: ' . $e->getMessage());
            return [];
        }
    }
}
