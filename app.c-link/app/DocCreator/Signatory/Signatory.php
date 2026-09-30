<?php
namespace App\DocCreator\Signatory;

use App\DocCreator\Signatory\Service\Docusign;
use App\DocCreator\Signatory\Signer\AbstractSigner;

class Signatory
{

    /**
     * @var array
     */
    public array $documents = [];

    /**
     * @var array
     */
    protected array $signers = [];

    /**
     * @var AbstractSigner
     */
    protected AbstractSigner $signer;

    /**
     * @var array
     */
    protected array $config = [];

    /**
     * @var string
     */
    protected string $prefixArea = "";

    /**
     * @var string
     */
    protected string $prefixDateArea = "";

    /**
     * @var array
     */
    protected array $services = [
        'docusign' => Docusign::class
    ];

    /**
     * @var Signatory
     */
    protected Signatory $service;

    /**
     * @param string $service
     * @return bool
     */
    public function isValidService(string $service): bool
    {
        $services = $this->getServices();
        return isset($services[$service]);
    }

    /**
     * @return array
     */
    public function getServices(): array
    {
        return $this->services;
    }


    /**
     * @return Signatory
     */
    public function getService(): Signatory
    {
        return $this->service;
    }

    /**
     * @param string $client
     * @return Signatory
     * @throws \Exception
     */
    public function setService(string $client): Signatory
    {
        try{
            $services = $this->getServices();
            $this->service = (new $services[$client]($this->getConfig()));
            return $this->service;
        }catch (\Exception $e){
            throw new \Exception("Service was not found $client");
        }
    }

    /**
     * @param array $config
     */
    public function setConfig(array $config): void
    {
        $this->config = $config;
    }

    /**
     * @param string $key
     * @return array|string
     */
    public function getConfig(string $key = '')
    {
        return $this->config[$key] ?? $this->config;
    }

    /**
     * @return array
     */
    public function getDocuments(): array
    {
        return $this->documents;
    }

    /**
     * @param AbstractSigner $signer
     */
    public function setSigner(AbstractSigner $signer): void
    {
        $this->signer = $signer;
        $this->signers[] = $this->signer;
    }

    /**
     * @return array
     */
    public function getSigners(): array
    {
        return $this->signers;
    }

    /**
     * @return AbstractSigner
     */
    public function getSigner(): AbstractSigner
    {
        return $this->signer;
    }

    /**
     * @return string
     */
    public function getPrefixArea(): string
    {
        return $this->prefixArea;
    }

    /**
     * @param string $prefix
     */
    public function setPrefixArea(string $prefix): void
    {
        $this->prefixArea = $prefix;
    }

    /**
     * @return string
     */
    public function getPrefixDateArea(): string
    {
        return $this->prefixDateArea;
    }

    /**
     * @param string $prefix
     */
    public function setDatePrefixArea(string $prefix): void
    {
        $this->prefixDateArea = $prefix;
    }

}
