<?php

namespace Core\Service;

class GoogleMapsService extends RestService
{

    /**
     * @var String
     */
    const CONTENT_TYPE = "application/json";

    /**
     * @param array $addresses
     * @return string
     */
    public static function prepareDistanceAddresses(array $addresses)
    {
        return implode("|", $addresses);
    }

    /**
     * @param string $origin
     * @param string $destination
     * @param string $serviceId
     * @return array
     * @throws \Exception
     */
    public static function getDistance(string $origin, string $destination, string $serviceId = "google_maps"): array
    {
        $service = Manager::getService($serviceId);
        $res = $service->makeRequest("json", [
            'origins'      => $origin,
            'destinations' => $destination,
            'units'        => 'imperial'
        ]);
        $content = $res->getResponse()->get('content') ?? '';
        $json = json_decode(strval($content), true);
        $distances = [];
        if ( is_array($json) && $json['status'] ) {
            $origins      = explode("|", $origin);
            $destinations = explode("|", $destination);
            foreach($json['rows'] as $key => $row){
                if(isset($row['elements'][$key]['distance'])) {
                    $distances[$key] = [
                        'origin' => $origins[$key],
                        'destination' => $destinations[$key],
                        'distance' => str_replace("mi", "miles", $row['elements'][$key]['distance'])
                    ];
                }
            }
        }
        return $distances;
    }
}
