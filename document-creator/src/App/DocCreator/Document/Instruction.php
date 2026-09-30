<?php

namespace App\DocCreator\Document;

class Instruction extends AbstractDocument{

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
            'instruction' => $this->getDocCreator()->getModel('instruction'),
        ];
    }
}
