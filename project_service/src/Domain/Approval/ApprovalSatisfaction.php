<?php

namespace App\Domain\Approval;

class ApprovalSatisfaction
{
  public static function isApproverSatisfied(array $row): bool
  {
    return !empty($row['is_satisfied_by_self_approved'])
      || !empty($row['is_satisfied_by_higher_authority'])
      || !empty($row['is_level_satisfied_by_self_approved'])
      || !empty($row['is_level_satisfied_by_higher_authority']);
  }

  public static function isLevelSatisfied(array $row): bool
  {
    return !empty($row['is_level_satisfied_by_self_approved'])
      || !empty($row['is_level_satisfied_by_higher_authority']);
  }

  /**
   * @param bool $inProgressAssigned set true after the first non-satisfied level is marked in_progress
   */
  public static function resolveWorkflowStatus(bool $isLevelSatisfied, bool &$inProgressAssigned): string
  {
    if ($isLevelSatisfied) {
      return 'completed';
    }

    if (!$inProgressAssigned) {
      $inProgressAssigned = true;

      return 'in_progress';
    }

    return 'pending';
  }

  /**
   * @param array<int, array<string, mixed>> $rows
   */
  public static function isLevelSatisfiedFromRows(array $rows): bool
  {
    return self::isLevelSatisfied(self::buildLevelMetaFlagsFromRows($rows));
  }

  /**
   * Approver flags for approvals.meta / order_approvers.meta.
   * Level satisfaction forces the matching is_satisfied_by_* flag true (payload ignored for that key).
   *
   * @param array<string, mixed> $row
   */
  public static function buildApproverMeta(array $row): string
  {
    $existing = [];
    if (isset($row['meta'])) {
      if (is_array($row['meta'])) {
        $existing = $row['meta'];
      } elseif (is_string($row['meta']) && $row['meta'] !== '') {
        $decoded = json_decode($row['meta'], true);
        $existing = is_array($decoded) ? $decoded : [];
      }
    }

    $levelSelfApproved = !empty($row['is_level_satisfied_by_self_approved']);
    $levelHigherAuthority = !empty($row['is_level_satisfied_by_higher_authority']);

    return json_encode(array_merge($existing, [
      'is_satisfied_by_self_approved' => $levelSelfApproved || !empty($row['is_satisfied_by_self_approved']),
      'is_satisfied_by_higher_authority' => $levelHigherAuthority || !empty($row['is_satisfied_by_higher_authority']),
    ]), JSON_THROW_ON_ERROR);
  }

  /**
   * @param array<string, mixed> $row
   * @return array{is_level_satisfied_by_self_approved: bool, is_level_satisfied_by_higher_authority: bool}
   */
  public static function buildLevelMetaFlags(array $row): array
  {
    return [
      'is_level_satisfied_by_self_approved' => !empty($row['is_level_satisfied_by_self_approved']),
      'is_level_satisfied_by_higher_authority' => !empty($row['is_level_satisfied_by_higher_authority']),
    ];
  }

  /**
   * @param array<int, array<string, mixed>> $rows
   * @return array{is_level_satisfied_by_self_approved: bool, is_level_satisfied_by_higher_authority: bool}
   */
  public static function buildLevelMetaFlagsFromRows(array $rows): array
  {
    $flags = self::buildLevelMetaFlags([]);
    foreach ($rows as $row) {
      if (!is_array($row)) {
        continue;
      }
      $flags['is_level_satisfied_by_self_approved'] = $flags['is_level_satisfied_by_self_approved']
        || !empty($row['is_level_satisfied_by_self_approved']);
      $flags['is_level_satisfied_by_higher_authority'] = $flags['is_level_satisfied_by_higher_authority']
        || !empty($row['is_level_satisfied_by_higher_authority']);
    }

    return $flags;
  }
}
