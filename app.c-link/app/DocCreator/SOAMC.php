<?php

namespace App\DocCreator;

use App\core\Config;

class SOAMC extends Table
{

    /**
     * @var string[]
     */
    public array $column = [
        'index',
        'item',
        'mlc_provide',
        'subcontractor_provide',
        'comments'
    ];

    /**
     * @return string
     */
    public function getCheckedImage(): string
    {
        $image = Config::get("assets.schedule_of_attendances.checked");
        return "<img alt='checked' src='" . $image . "' />";
    }

    /**
     * @return array
     */
    public function getRows(): array
    {
        $index = self::APPEND_INDEX;
        $json = json_decode($this->getContent(), true);

        if ($json) {
            $newTableClasses = "edit-document-table full-width table normalize-font-size justified schedule-attendance-mc";
            $props = $this->getData("props") ?? [];
            $props["className"] = $newTableClasses;
            $this->saveData("props", $props);

            $header = $this->getData('children')[0];
            $row = $this->getData('children')[1];

            // Remove last column, we don't show the remove buttons in the PDF
            array_pop($header["children"]);
            array_pop($row["children"]);

            // Update classes to adjust width of the first column
            $newClasses = "edit-document-table-column width-10 centered-text";
            $header["children"][0]["props"]["className"] = $newClasses;
            $row["children"][0]["props"]["className"] = $newClasses;

            $this->saveData("children", [$header, $row]);

            $checked_image = $this->getCheckedImage();
            $rowNumber = self::APPEND_INDEX;

            $children = $this->getData()["children"][1];
            $columns = $this->getColumns();
            foreach ($json as $value) {
                foreach ($columns as $key => $column_key) {
                    if ($column_key === 'index') {
                        $cellValue = isset($value['title']) ? '' : (string)$rowNumber;
                    } else if ($column_key === 'item') {
                        $val = isset($value['title']) && $value['title'] ? '' : ($value['item'] ?? '');
                        $cellValue = htmlspecialchars($val, ENT_QUOTES, 'UTF-8');
                    } else if ($column_key === 'mlc_provide' || $column_key === 'subcontractor_provide') {
                        $val = $value[$column_key] ?? '';
                        $cellValue = ((int)$val === 1 || $val === true) ? $checked_image : '';
                    } else if ($column_key === 'comments') {
                        $cellValue = $value['comments'] ?? '';
                    } else {
                        $cellValue = isset($value[$column_key]) ? $value[$column_key] : '';
                    }

                    if (isset($value['title']) && $value['title']) {
                        if ($column_key === 'item') {
                            $cellValue = isset($value['description']) ? sprintf('<b>%s</b>', $value['description']) : '';
                        } else {
                            $cellValue = '';
                        }
                    }
                    self::childrenSetValue($children, $key, $cellValue);
                }

                $this->appendChildren($index, $children);

                if (!isset($value['title'])) {
                    $rowNumber++;
                }

                $index++;
            }
            $data = $this->getData();
            return $data;
        }
        return [];
    }
}
