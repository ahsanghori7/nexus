<?php

namespace App\Models;


class Instruction extends Abstraction
{

    public const ANZ_REGION = [2,4];

    /**
     * @param string|null $k
     * @return array
     */
    public function getMeta(string $k = null)
    {
        $meta = $this->getData("meta");
        if (is_string($meta)) {
            $meta = json_decode($meta, true);
        }
        if ($k && $meta) {
            return $meta[$k] ?? false;
        }
        return $meta ?? [];
    }

    /**
     * @param array $models
     * @return string
     * @throws \App\Api\Exception
     */
    public function getInstructionDescription(array $models = []): string
    {
        $instruction = $models['models']['instruction'] ?? $this;
        if ($instruction) {
            $description = $instruction->getData("description");
        }

        return $description ?? '';
    }

    /**
     * @param array $models
     * @return string
     */
    public function getPrice(array $models = []): string
    {
        $account = $models['models']['account'] ?? null;
        $symbol = $account->getData("region_group_id") && in_array($account->getData("region_group_id"), self::ANZ_REGION) ? "$" : "£";
        $instruction = $models['models']['instruction'] ?? $this;
        if ($instruction) {
            $price = $instruction->getData("price");
            if ($price) {
                $price = $symbol . number_format($price / 100, 2, ".", ",");
            } else {
                $price = 'To be valued & agreed';
            }
        }
        return $price ?? '';
    }

    /**
     * @param array $models
     * @return array|mixed|string
     */
    public function getInstructionNr(array $models = [])
    {
        $instruction = $models['models']['instruction'] ?? $this;
        if ($instruction) {
            $nr = $instruction->getData("nr");
        }
        return $nr ?? '';
    }

    /**
     * @param string $format
     * @return string
     */
    public function formatDate(string $format = 'H:i \o\n F j, Y'): string
    {
        $instruction = $this;
        $date = $instruction->getData("date");
        if ($date) {
            $date = date($format, strtotime($date));
        }
        return $date ?? '';
    }
}
