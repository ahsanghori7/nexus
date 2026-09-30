<?php

namespace App\Models;

use App\Factory\UserFactory;
use App\Api\Account as AccountApi;
use App\Api\Project;
use App\Api\Tender;
use App\core\Config;
use App\Api\Email\Email;
use App\Api\Document;
use App\Api\Vertex;

class Signatory extends Abstraction
{

    /**
     * Postmark template used when a signatory is first asked to sign.
     */
    const TEMPLATE_ACTION_REQUIRED = 'Order Signatory Action Required';

    /**
     * Postmark template used when an existing request is chased up.
     */
    const TEMPLATE_REMINDER = 'Order Signatory Reminder';

    /**
     * @param array $signatory
     * @param array $statuses
     * @return string
     * @throws \Exception
     */
    public static function getSignatoryStatus(array $signatory, array $statuses): string
    {
        if (!$statuses) {
            throw new \Exception('No statuses provided');
        }
        $status_declined = array_filter(array_map(function ($status) {
            return ($status['uid'] === 'declined') ? $status['id'] : null;
        }, $statuses));
        $status_pending = array_filter(array_map(function ($status) {
            return ($status['uid'] === 'pending') ? $status['id'] : null;
        }, $statuses));
        $signers = $signatory['signer'] ?? [];
        $status  = $signers ? 'Signed' : 'Pending Signature';

        //Check to see if all the signatures are provided
        foreach ($signers as $value) {
            if (in_array($value['signer_status_id'], $status_declined, true)) {
                $status = 'Withdrew';
                break;
            }
            if (in_array($value['signer_status_id'], $status_pending, true)) {
                $status = 'Pending Signature';
            }
        }
        return $status;
    }

    /**
     * @param array $signers
     * @param array $signature_status
     * @param int $user_id
     * @return array
     * @throws \Exception
     */
    public static function getSigners(array $signers, array $signature_status, int $user_id = 0): array
    {

        $user_id = !$user_id ? (int)UserFactory::getUser()->getId() : $user_id;
        $signature_status = array_map('intval', array_values(array_filter($signature_status)));

        $total = 0;
        $return = ['total' => 0, 'can_sign' => false];

        if (empty($signers['signer'])) {
            return $return;
        }

        $signatory_orders = [];
        $signer_orders = self::getSignerOrdersFromStoredSigners($signers['signer']);

        //get the signatories order
        array_map(function ($signer) use (&$signatory_orders, &$total, $signature_status, &$return, $signer_orders) {
            $user = AccountApi::getUser($signer['signer_user_id']);
            //if the user is not found that means that it was removed by the contractor from team manager
            if (!$user) {
                return;
            }
            $signatory_order = $signer_orders[$signer['signer_user_id']] ?? $total;
            if (!in_array((int)$signer['signer_status_id'], $signature_status, true)) {
                $signatory_orders[$signatory_order] = [
                    'user_id'   => $user['id'],
                    'status_id' => $signer['signer_status_id']
                ];
            } else {
                $return['total']++;
            }
            $total++;
        }, $signers['signer']);
        //if there are pending signatories check if the user needs to sign
        if ($signatory_orders) {
            ksort($signatory_orders);
            $signers_pending = 0;
            array_map(function ($item) use (&$return, $signature_status, $user_id, &$signers_pending) {
                if (!in_array((int)$item['status_id'], $signature_status, true)) {
                    $signers_pending++;
                }
                if ((int)$item['user_id'] === $user_id) {
                    $return['can_sign'] = $signers_pending === 1;
                }
            }, $signatory_orders);
        }

        return $return + ['total' => $total];
    }

    /**
     * @param array $signers
     * @return array<int,int>
     */
    public static function getSignerOrdersFromStoredSigners(array $signers): array
    {
        $sorted_signers = array_values($signers);
        usort($sorted_signers, function ($a, $b) {
            return (($a['id'] ?? 0)) <=> (($b['id'] ?? 0));
        });

        $total_signers = count($sorted_signers);
        $signature_order = self::getSignatoryOrder()[$total_signers] ?? array_keys($sorted_signers);
        $orders = [];

        foreach ($sorted_signers as $index => $signer) {
            $orders[$signer['signer_user_id']] = $signature_order[$index] ?? $index;
        }

        return $orders;
    }

    /**
     * @return array[]
     */
    public static function getSignatoryOrder()
    {
        return [
            2 => [
                1, //sub contractor
                0, //main contractor
            ],
            3 => [
                2, //sub contractor
                0, //main contractor
                1, //main contractor witness
            ],
            4 => [
                2, //sub contractor
                3, //sub contractor witness
                0, //main contractor
                1, //main contractor witness
            ],
            6 => [
                4, //sub contractor
                5, //sub contractor witness
                0, //main contractor
                1, //main contractor witness
                2, //main contractor bank
                3, //main contractor bank witness
            ]
        ];
    }

    /**
     * @param int $user_id
     * @param array $signer_ids
     * @return int
     * this will get the user ids in the order that they come from document creator
     * main contractor           -> index 0
     * main contractor witness   -> index 1
     * sub contractor            -> index 2
     * sub contractor witness    -> index 3
     */
    public static function getSignatoryOrderId(int $user_id, array $signer_ids): int
    {
        $total_signers = count($signer_ids);
        $signature_order = self::getSignatoryOrder()[$total_signers] ?? [];
        $key_search = array_search($user_id, $signer_ids);
        return $signature_order[$key_search];
    }

    /**
     * Find a user within an account team.
     *
     * @param array $users
     * @param int $user_id
     * @return array the matching user, or an empty array when they are no longer on the account
     */
    public static function findAccountUser(array $users, int $user_id): array
    {
        if (!$user_id) {
            return [];
        }

        foreach ($users as $user) {
            if ((int)($user['id'] ?? 0) === $user_id) {
                return $user;
            }
        }

        return [];
    }

    /**
     * @param string $envelope_id
     * @param array $data
     * @throws \App\Api\Exception
     */
    public static function sendSignQueueEmail(string $envelope_id, array $data)
    {
        ksort($data['signatory_users']);
        $signatory_user          = array_shift($data['signatory_users']);
        $user_id                 = (int)$signatory_user['user_id'];
        $contractor_account      = AccountApi::getAccount($data['contractor_id']);
        $account_users           = (array)($contractor_account['users'] ?? []);
        $contractor_user_account = array_shift($contractor_account['users']);
        //the email is signed off by whoever triggered it (e.g. a resend), not the account holder
        $sent_by                 = self::findAccountUser($account_users, (int)($data['sender_user_id'] ?? 0))
            ?: (array)$contractor_user_account;
        $is_subcontractor        = AccountApi::isTypeOf($signatory_user['type_id'], AccountApi::getSpecialistTypes());
        $subcontractor_account   = AccountApi::getAccount(AccountApi::getAccountIdByUser($user_id));
        $request                 = (new UserModel([], (string)$user_id))->createTokenByLabel($user_id, 'signatory_request', [
            'envelope_id'    => $envelope_id,
            'recipient_id'   => $user_id,
            'project_id'     => $data['pid'],
            'tender_id'      => $data['tid'],
            'contractor'     => $data['contractor_id'],
            'subcontractor'  => $data['subcontractor_id'],
            'type'           => ($is_subcontractor === true) ? 'Subcontractor' : 'Contractor',
            'sign_shortcode' => "signatory_area_id_$user_id",
        ]);
        $json = $request->json()["data"] ?? [];
        Email::send([
            'sender'   => ['id' => $user_id],
            'to'       => $signatory_user['email'],
            'template' => $data['template'] ?? self::TEMPLATE_ACTION_REQUIRED,
            'extra'    => [
                'project_name'       => Project::getProject($data['pid'])['name'],
                'tender_name'        => Tender::getTender($data['pid'], $data['tid'])['label'],
                "subcontractor_name" => $signatory_user['display_name'],
                "subcontractor_company_name" => $subcontractor_account['name'],
                "user_name"          => $contractor_user_account['display_name'] ?? '',
                "user_role"          => trim((string) ($contractor_user_account['job_title'] ?? '')),
                "sent_by_name"       => $sent_by['display_name'] ?? '',
                "sent_by_role"       => trim((string) ($sent_by['job_title'] ?? '')),
                'email'              => $contractor_account['email'],
                'company_name'       => $contractor_account['name'],
                "company_telephone"  => $contractor_account['mobile'],
                "docusign"           => sprintf("%s/signatory/request/%s", Config::get("url.site"), $json['token'])
            ]
        ], ($is_subcontractor === true) ? 'prosper' : 'clink');

        // Notify the signatory a document needs their signature.
        Vertex::createNotificationSilently([
            'account_id' => (int) ($subcontractor_account['id'] ?? 0),
            'receiver_user_id' => $user_id,
            'project_id' => (int) $data['pid'],
            'type' => 'signature_required',
            'title' => 'Document awaiting your signature',
            'message' => json_encode(array_values(array_filter([
                ['label' => 'Project', 'value' => Project::getProject($data['pid'])['name']],
                ['label' => 'Request Type', 'value' => 'Order'],
                ['label' => 'By', 'value' => $contractor_user_account['display_name']],
            ], fn ($part) => $part['value'] !== null && $part['value'] !== ''))),
            'target_type' => 'document',
            'target_url' => sprintf("%s/signatory/request/%s", Config::get("url.site"), $json['token']),
        ]);
    }

    /**
     * @param array $data
     * @return string
     */
    public function getSignatureDate(array $data): string
    {
        try {
            $document = $data['models']['document'] ?? null;
            if ($document) {
                $status = Document::get("signatory/status", ['uid' => 'signed']);
                $status_id = array_shift($status)['id'];
                $signers = Document::get("document/" . $document->getId() . "/signers");
                $signers = array_shift($signers);
                if ($signers) {
                    $signer = $signers['signer'];
                    $types = AccountApi::getTypes();
                    $type_id = (int)($types[$data['account_type_uid']] ?? 0);
                    if ($signer && $type_id) {
                        foreach ($signer as $value) {
                            if ((int)$value['signer_status_id'] === (int)$status_id) {
                                $account = AccountApi::getAccount(AccountApi::getAccountIdByUser($value['signer_user_id']));
                                if ((int)$account['type_id'] === $type_id) {
                                    $sign_date = (new \DateTime($value['signer_updated_at']))->format($data['format'] ?? 'Y-m-d');
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            $sign_date = '';
        }
        return $sign_date ?? '';
    }
}
