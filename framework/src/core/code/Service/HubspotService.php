<?php

namespace Core\Service;

use Core\Data\Shape;

class HubspotService extends RestService
{

    /**
     * @var String
     */
    const CONTENT_TYPE = "application/json";

    /**
     * @param string $email
     * @return mixed
     * @throws \Exception
     */
    public function getContactId(string $email): mixed
    {
        $res = $this->makeRequest("/crm/v3/objects/contacts/search");
        $res->setData(new Shape([
            'properties' => [
                'email'
            ],
            'filters' => [
                [
                    'propertyName' => 'email',
                    'operator'=> 'EQ',
                    'value'=> $email
                ]
            ]
        ]));
        $content = $res->getResponse()->get('content') ?? '';
        $json = json_decode(strval($content), true);
        if(is_array($json) && isset($json['total']) && $json['total'] == 1){
            $json = array_shift($json['results']);
            return $json['id'];
        }
        return null;
    }

    public function getContact(string $email): mixed
    {
        $res = $this->makeRequest("/crm/v3/objects/contacts/search");
        $res->setData(new Shape([
            'properties' => [
                'email',
                'how_to_win_work_opted'
            ],
            'filters' => [
                [
                    'propertyName' => 'email',
                    'operator'=> 'EQ',
                    'value'=> $email
                ]
            ]
        ]));
        $content = $res->getResponse()->get('content') ?? '';
        $json = json_decode(strval($content), true);
        if(is_array($json) && isset($json['total']) && $json['total'] == 1){
            $json = array_shift($json['results']);
            return $json;
        }
        return null;
    }

    /**
     * @param string $to
     * @param int $emailId
     * @param array<string, mixed> $properties
     * @param array<int, string> $cc
     * @return Shape
     */
    public function email(string $to, int $emailId, array $properties = [], array $cc = []) : Shape {

        $package = [
            "message" => ["to" => $to],
            "emailId" => $emailId
        ];
        if($cc){
            $package["message"]["cc"] = $cc;
        }

        if($properties) {
            foreach (["contact", "custom"] as $type) {
                if (isset($properties[$type])) {
                    $package[$type . "Properties"] = $properties[$type];
                }
            }
        }
        return $this->write("/marketing/v3/transactional/single-email/send", new Shape(["data" => $package]));
    }
}
