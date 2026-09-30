<?php
namespace App\DocCreator\Signatory\Signer;

use App\Api\Aws\Sns;
use App\Models\UserModel;
use DocuSign\eSign\Api\EnvelopesApi;
use DocuSign\eSign\Model\Date;
use DocuSign\eSign\Model\RecipientViewRequest;
use DocuSign\eSign\Model\Signer;
use DocuSign\eSign\Model\SignHere;
use DocuSign\eSign\Model\Tabs;
use DocuSign\eSign\Model\Text;

class Docusign extends AbstractSigner
{
    /**
     * @param UserModel $user
     */
    public function setSignerUser(UserModel $user): void
    {
        $signer = new Signer(
            [
                'email'            => $user->getData("email"),
                'name'             => $user->fullName(),
                'recipient_id'     => $user->getId(),
                'client_user_id'   => $user->getId(),
                'routing_order'    => $user->getData("signatory_order")
            ]
        );
        $signer->settabs(new Tabs(
            [
                'sign_here_tabs' => [new SignHere([
                    'anchor_string' => $user->getData("signatory")
                ])],
                'date_tabs' => [
                    new Text([
                        'anchor_y_offset' => '-5',
                        'anchor_x_offset' => '-5',
                        'anchor_string' => $user->getData("signatory_date"),
                        "validation_pattern" => "^(|by DocuSign)((|0)[1-9]|[1-2][0-9]|3[0-1])/((|0)[1-9]|1[0-2])/[0-9]{4}$"
                    ])
                ]
            ]
        ));
        $this->signer = $signer;
    }

    /**
     * @param string $envelope_id
     * @param $account_id
     * @param string $return_url
     * @return string
     * @throws \DocuSign\eSign\Client\ApiException
     */
    public function getSignerLink(string $envelope_id, $account_id, string $return_url): string
    {
        return (new EnvelopesApi())->createRecipientView(
            $account_id,
            $envelope_id,
            new RecipientViewRequest([
                'authentication_method' => 'None',
                'client_user_id' => $this->getUserId(),
                'email'          => $this->getEmail(),
                'user_name'      => $this->getName(),
                'recipient_id'   => $this->getRecipientId(),
                'return_url'     => $return_url
            ])
        )->getUrl();
    }

    /**
     * @return mixed
     */
    public function getSignerShortcode()
    {
        $tabs = $this->getSigner()->getTabs()->getSignHereTabs();
        return $tabs[0]->getAnchorString();
    }

    /**
     * @return mixed
     */
    public function getRecipientId(): string
    {
        return strval($this->getSigner()->getRecipientId());
    }

    /**
     * @return string
     */
    public function getRoutingOrder(): string
    {
        return strval($this->getSigner()->getRoutingOrder());
    }

    /**
     * @return mixed
     */
    public function getName(): string
    {
        return strval($this->getSigner()->getname());
    }

    /**
     * @return mixed
     */
    public function getEmail(): string
    {
        return strval($this->getSigner()->getEmail());
    }

    /**
     * @return mixed
     */
    public function getUserId(): string
    {
        return strval($this->getSigner()->getClientUserId());
    }
}
