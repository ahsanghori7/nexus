<?php

class EntityNotFound extends ActionError {
    public function __construct() {
        parent::__construct(ActionError::NOT_FOUND, "Entity not found");
    }
}
