<?php

declare(strict_types=1);

namespace App\Domain\Email;

enum EmailStatusEnum: int
{
    case NEW_TENDER = 1;
    case BOUNCE = 2;
    case OPEN = 3;
    case SENT = 4;

    public function label(): string
    {
        return match($this) {
            self::NEW_TENDER => 'New Tender Notification',
            self::BOUNCE => 'Bounce',
            self::OPEN => 'Open',
            self::SENT => 'Sent',
        };
    }

    public static function getLabel(int $id): string
    {
        return self::tryFrom($id)?->label() ?? 'Unknown';
    }

    public static function getAllLabels(): array
    {
        return [
            self::NEW_TENDER->value => self::NEW_TENDER->label(),
            self::BOUNCE->value => self::BOUNCE->label(),
            self::OPEN->value => self::OPEN->label(),
            self::SENT->value => self::SENT->label(),
        ];
    }
}
