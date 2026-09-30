<?php

namespace CL\Pdf\Html;


class TenderAddendumDocumentChanges extends Table {

    public function getTag() : string {
        return "table";
    }

    /**
     * Here we override the default getNamespace method as we only want children to be
     * child classes of Table
     * @return string === CL\Pdf\Html\Table
     */
    public function getNs() : string {
        return str_replace("TenderAddendumDocumentChanges", "Table", get_class($this));
    }
}
