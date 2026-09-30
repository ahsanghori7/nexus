<?php

namespace App\DocCreator\Document;

class Tender extends AbstractDocument{

    /**
     * @return array
     */
    public function getDataModels(): array
    {
        return [
            'account' => $this->getDocCreator()->getModel('account'),
            'project' => $this->getDocCreator()->getModel('project'),
            'tender' => $this->getDocCreator()->getModel('tender'),
            'subcontractor' => $this->getDocCreator()->getModel('subcontractor'),
        ];
    }
}
