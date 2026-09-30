<?php

declare(strict_types=1);

namespace App\Domain\Project;

use App\Domain\AbstractModel;

class TeamMemberRoleMapping extends AbstractModel
{
    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'project_team_member_role_mapping';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'role_id',
        'user_id',
        'project_id',
        'added_date'
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'role_id' => [
            'type' => 'int',
            'required' => false
        ],
        'project_id' => [
            'type' => 'int',
            'required' => true
        ],
        'user_id' => [
            'type' => 'int',
            'required' => true
        ],
        'added_date' => [
            'type' => 'string',
            'required' => false
        ]
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function project(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Project::class, "project_id");
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\hasOne
     */
    public function teamMemberRole(): \Illuminate\Database\Eloquent\Relations\hasOne
    {
        return $this->hasOne(TeamMemberRole::class, "id", "role_id");
    }
}
