const mapAssignedApproversToLevels = (assignedApprovers, isLevel) => {
  if (
    !assignedApprovers ||
    (Array.isArray(assignedApprovers) && !assignedApprovers.length)
  ) {
    return [];
  }

  const mapApprover = (approver) => {
    const user = approver?.user ?? {};
    const approverUser = approver?.approver_user ?? {};

    const firstName =
      user?.firstname ?? approverUser?.display_name?.split(' ')[0] ?? '';
    const lastName =
      user?.lastname ??
      approverUser?.display_name?.split(' ').slice(1).join(' ') ??
      '';
    const status = approver?.status ?? {};
    const workflow = approver?.approval_level_workflow ?? {};
    const meta = approver?.meta ?? {};

    return {
      id: approver?.id ? String(approver.id) : null,
      role_label: user?.account_role_label ?? approver?.role_label ?? null,
      is_level_satisfied_by_higher_authority:
        meta?.is_level_satisfied_by_higher_authority,
      is_level_satisfied_by_self_approved:
        meta?.is_level_satisfied_by_self_approved,
      is_satisfied_by_higher_authority: meta?.is_satisfied_by_higher_authority,
      is_satisfied_by_self_approved: meta?.is_satisfied_by_self_approved,
      approver_user: {
        display_name:
          approverUser?.display_name ?? `${firstName} ${lastName}`.trim(),
        email: user?.email ?? approverUser?.email ?? null,
        initials: (
          (firstName?.[0] ?? '') + (lastName?.[0] ?? '')
        ).toUpperCase(),
      },
      status: {
        value: status?.label?.toLowerCase() ?? null,
        label: status?.label ?? null,
      },
      approval_requested_at:
        workflow?.created_at ?? approver?.created_at ?? null,
      actioned_at: approver?.updated_at ?? null,
    };
  };

  if (!isLevel && Array.isArray(assignedApprovers)) {
    return [
      {
        level_number: 1,
        status: assignedApprovers[0]?.status?.label?.toLowerCase() ?? null,
        rule: null,
        isLevel,
        approvers: assignedApprovers.map(mapApprover),
      },
    ];
  }

  if (typeof assignedApprovers !== 'object') return [];

  return Object.values(assignedApprovers).map((level) => ({
    level_number: level?.level ?? null,
    status: level?.status ?? null,
    rule: level?.rule ?? null,
    isLevel,
    approvers: Array.isArray(level?.approvers)
      ? level.approvers.map(mapApprover)
      : [],
  }));
};

export default mapAssignedApproversToLevels;
