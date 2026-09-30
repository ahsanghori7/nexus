<?php

namespace Core\Middleware;

use Core\Data\Shape;
use Core\Data\Shape\Validation;
use Core\Router\Route\Action;
use Core\Middleware\Exception as MiddlewareException;

class Form
{

    /**
     * @param Validation $validation
     * @param string $saveKey
     * @return Callable
     */
    public static function validate(Validation $validation, string $saveKey = "validated_form"): callable
    {
        return function (Action $shape) use ($validation, $saveKey) {
            $form = $shape->getRoute()->getRequest()->getData()->getShape("form");

            if ($form->hasData()) {
                try {
                    $validation->test($form);
                    $shape->set($saveKey, $form);
                } catch (MiddlewareException $me) {
                    throw new MiddlewareException($me->getId(), $me->getMessage());
                } catch (\Exception $e) {
                    $shape->set("form_validation_error", $e->getMessage());
                    throw new MiddlewareException("formValidation", "Form Failed validation : " . $e->getMessage());
                }
            } else {
                throw new MiddlewareException("formValidation", "Missing Form Data");
            }
        };
    }

    /**
     * @param Validation $validation
     * @param string $saveKey
     * @return Callable
     */
    public static function validateJson(Validation $validation, string $saveKey = "validated_form"): callable
    {
        return function (Action $shape) use ($validation, $saveKey) {
            $json = $shape->getRoute()->getRequest()->getData()->getShape("json");

            if ($json->hasData()) {
                try {
                    $validation->test($json);
                    $shape->set($saveKey, $json);
                } catch (MiddlewareException $me) {
                    throw new MiddlewareException($me->getId(), $me->getMessage());
                } catch (\Exception $e) {
                    $shape->set("form_validation_error", $e->getMessage());
                    throw new MiddlewareException("formValidation", "Json Failed validation : " . $e->getMessage());
                }
            } else {
                throw new MiddlewareException("formValidation", "Missing Json Data");
            }
        };
    }

    /**
     * @param string $saveKey
     * @return Callable
     */
    public static function sanitizeData(string $saveKey = "validated_form"): callable
    {
        return function (Action $shape) use ($saveKey) {
            $data = $shape->get($saveKey, null);
            $sanitizeData = [];
            if ($data) {
                $sanitizeData = $data;
                foreach($data as $key => $value) {
                    $sanitizeData[$key] = strip_tags(trim($value));
                }
            }
            $shape->set($saveKey, $sanitizeData);
        };
    }
}
