<?php
namespace App\DocCreator\Signatory\Signer;

use App\Models\UserModel;

/**
 * Class AbstractSigner
 * @package App\DocCreator\Signatory
 */
abstract class AbstractSigner
{

    protected $signer;

    /**
     * @param UserModel $user
     */
    abstract public function setSignerUser(UserModel $user): void;

    /**
     * @param string $envelope_id
     * @param $account_id
     * @param string $return_url
     * @return string
     */
    abstract public function getSignerLink(string $envelope_id, $account_id, string $return_url): string;

    /**
     * @return string
     */
    abstract public function getRecipientId(): string;

    /**
     * @return string
     */
    abstract public function getName(): string;

    /**
     * @return string
     */
    abstract public function getEmail(): string;

    /**
     * @return string
     */
    abstract public function getUserId(): string;

    /**
     * @return mixed
     */
    public function getSigner()
    {
        return $this->signer;
    }
}
