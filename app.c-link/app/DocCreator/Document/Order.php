<?php

namespace App\DocCreator\Document;

class Order extends AbstractDocument{

    /**
     * @return array
     */
    public function getDataModels(): array
    {
        return [
            'account' => $this->getDocCreator()->getModel('account'),
            'project' => $this->getDocCreator()->getModel('project'),
            'tender' => $this->getDocCreator()->getModel('tender'),
            'transaction' => $this->getDocCreator()->getModel('transaction'),
            'signatory' => $this->getDocCreator()->getModel('signatory'),
        ];
    }
}
