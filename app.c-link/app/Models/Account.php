<?php
namespace App\Models;

use App\Api\S3;
use App\core\Environment as Env;
use App\Api\Project as ProjectApi;

class Account extends Abstraction {

    /**
     * @return mixed
     */
    public function firstName()
    {
        return $this->getData('user')['firstname'];
    }

    /**
     * @return mixed
     */
    public function lastName()
    {
        return $this->getData('user')['lastname'];
    }

    /**
     * @param string $separator
     * @return string
     */
    public function fullName(string $separator = ' '): string
    {
        return $this->firstName() . $separator . $this->lastName();
    }

    /**
     * @return string
     * @throws \Exception
     */
    public function getLogo(): string
    {
        $file = sprintf("%s/logo.png", md5($this->getId()));
        return S3::getURI(S3::getBucket('asset'), S3::getKey($file, "account", ["logo"]));
    }

    /**
     * @return string
     */
    public function getPhone(): string
    {
        if($this->getData('landline')){
            return $this->getData('landline');
        }
        if($this->getData('mobile')){
            return $this->getData('mobile');
        }
        if($this->getData('contact_number')){
            return $this->getData('contact_number');
        }
        $user = $this->getData('user');
        if(!$user){
            $users = $this->getData('users');
            if($users){
                $user = $users[0];
            }
        }
        if(isset($user['contact_number'])){
            return $user['contact_number'];
        }
        return '';
    }

    /**
     * @param array $project_history
     * @param array $exclude_status_ids
     * @param string $starting_date
     * @return int
     */
    public function getEnquiryReceivedTotal(array $project_history, array $exclude_status_ids = [], string $starting_date = '')
    {
        $total = 0;
        foreach($project_history as $project){
            if(isset($project['tender'])) {
                foreach ($project['tender'] as $tender) {
                    $enquiries = $tender['Enquiry'][$this->getId()] ?? [];
                    foreach($enquiries['history'] as $enquiry){
                        $created_at = Util::formatDate($enquiry['created_at'], "Y-m-d");
                        if(!$starting_date || (strtotime($created_at) >= strtotime($starting_date))) {
                            if ( in_array($enquiry['status_id'], $exclude_status_ids, true) ) {
                                continue;
                            }
                            $total++;
                        }
                    }
                }
            }
        }
        return $total;
    }
}
