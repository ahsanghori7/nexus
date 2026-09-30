<?php

declare(strict_types=1);

namespace App\Domain\Project;

use App\Domain\AbstractModel;
use App\Domain\Project\Package as PackageMapping;

class Project extends AbstractModel
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
  protected $table = 'project';

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
  protected $fillable = [
    'name',
    'slug',
    'logo',
    'description',
    'type',
    'phase',
    'group_id',
    'author_id',
    'region',
    'start',
    'end',
    'reference',
    'status',
    'created_at',
    'site_address_one',
    'site_address_two',
    'site_address_city',
    'site_address_postcode',
    'employer_liabilty_insurance',
    'public_product_insurance',
    'pricing_doc_required',
    "performance_bond",
    "design_responsibility",
    "design_responsibility_period",
    "collateral_warranties_required",
    "warranties_provided_to",
    "liquidated_damages_applicable",
    "liquidated_damages_rate",
    "cap_on_liquidated_damages",
    "amendments_relevant_events_matters",
    "governing_law",
    "interim_valuation_frequency",
    "payment_due_date",
    "final_date_for_payment",
    "deadline_for_pay_less_notices",
    "schedule_of_payments_provided",
    "advance_payment_provision",
    "main_contractor_postal_address_for_notices",
    "main_contractor_email_address_for_notices",
    "subcontractor_postal_address_for_notices",
    "subcontractor_email_address_for_notices",
    "date_for_possession_of_site",
    "sectional_completion_dates",
    "review_period_for_drawings",
    "advance_warning_period",
    "public_product_insurance_responsible",
    "employer_liabilty_insurance_responsible",
    "professional_indemnity_insurance_responsible",
    "edition_of_jct_contract",
    "schedule_of_amendments_reference",
    "client_contact_name",
    "client_contact_email",
    "client_contact_postal_code",
    "site_constrains",
    "global_date_for_possession",
    "project_sections",
    "version",
  ];

  /**
   * @var array
   */
  protected $columns = [
    'id' => [
      'type' => 'int'
    ],
    'name' => [
      'type' => 'string',
      'required' => true
    ],
    'slug' => [
      'type' => 'string',
      'required' => true
    ],
    'type' => [
      'type' => 'int',
      'required' => true
    ],
    'group_id' => [
      'type' => 'int',
      'required' => true
    ],
    'author_id' => [
        'type' => 'int',
        'required' => true
    ],
    'region' => [
      'type' => 'int',
      'required' => true
    ],
    'phase' => [
      'type' => 'int',
      'required' => true
    ],
    'reference' => [
      'type' => 'string',
      'required' => true
    ],
    'status' => [
      'type' => 'int',
      'required' => false
    ],
    'start' => [
      'type' => 'string',
      'required' => true
    ],
    'end' => [
      'type' => 'string',
      'required' => true
    ],
    'logo' => [
      'type' => 'string',
      'required' => true
    ],
    'description' => [
      'type' => 'string',
      'required' => false
    ],
    'created_at' => [
      'type' => 'string',
      'required' => false
    ],
    'site_address_one' => [
      'type' => 'string',
      'required' => true
    ],
    'site_address_two' => [
      'type' => 'string',
      'required' => false
    ],
    'site_address_city' => [
      'type' => 'string',
      'required' => true
    ],
    'site_address_postcode' => [
      'type' => 'string',
      'required' => true
    ],
    'opening_hours_weekdays' => [
        'type' => 'string',
        'required' => true
    ],
    'opening_hours_weekends' => [
        'type' => 'string',
        'required' => true
    ],
    'employer_liabilty_insurance' => [
      'type' => 'int',
      'required' => true
    ],
    'public_product_insurance' => [
      'type' => 'int',
      'required' => true
    ],
    'professional_indemnity_insurance' => [
        'type' => 'int',
        'required' => true
    ],
    "client_address_one" => [
        "type"  => "string",
        'required' => false
    ],
    "client_address_two" => [
        "type"  => "string",
        'required' => false
    ],
    "client_address_city" => [
        "type"  => "string",
        'required' => false
    ],
    "client_address_postcode" => [
        "type"  => "string",
        'required' => false
    ],
    "client_name" => [
        "type"  => "string",
        'required' => false
    ],
    "client_reg_number" => [
        "type"  => "string",
        'required' => false
    ],
    "principal_contractor" => [
        "type"  => "string",
        'required' => false
    ],
    "notice_period_commence_work_on_site" => [
        "type"    => "integer",
        'required' => false
    ],
    "comment_period_subcontractor_drawings" => [
        "type"    => "integer",
        'required' => false
    ],
    "sub_contract_base_date" => [
        "type"  => "string",
        'required' => false
    ],
    "does_sectional_completion_apply" => [
        "type"   => "integer",
        'required' => false
    ],
    "retention_release_date" => [
        "type"   => "integer",
        'required' => false
    ],
    "prime_cost_addition_for_materials" => [
        "type"   => "integer",
        'required' => false
    ],
    "prime_cost_addition_for_plant" => [
        "type"   => "integer",
        'required' => false
    ],
    "nominee_for_disputes" => [
        "type"   => "string",
        'required' => false
    ],
    "main_contract_signed_date" => [
        "type"   => "string",
        'required' => false
    ],
    "rectification_defects_period" => [
        "type"    => "integer",
        'required' => false
    ],
    "retention" => [
        "type"    => "integer",
        'required' => false
    ],
    "employers_agent" => [
        "type"  => "string",
        'required' => false
    ],
    "principal_designer" => [
        "type"  => "string",
        'required' => false
    ],
    "form_of_contract_for_main_contract" => [
        "type"  => "string",
        'required' => false
    ],
    'pricing_doc_required' => [
      'type' => 'int',
      'required' => true
    ],
    'gia' => [
      'type' => 'string',
      'required' => false
    ],
    'status_updated_at' => [
        'type' => 'string',
        'required' => false
    ],
    "performance_bond" => [
        "type"      => "boolean",
        'required'  => false
    ],
    "design_responsibility" => [
        "type"      => "boolean",
        'required'  => false
    ],
    "design_responsibility_period" => [
        "type"      => "string",
        'required'  => false
    ],
    "collateral_warranties_required" => [
        "type"      => "boolean",
        'required'  => false
    ],
    "warranties_provided_to" => [
        "type"      => "string",
        'required'  => false
    ],
    "liquidated_damages_applicable" => [
        "type"      => "boolean",
        'required'  => false
    ],
    "liquidated_damages_rate" => [
        "type"      => "string",
        'required'  => false
    ],
    "cap_on_liquidated_damages" => [
        "type"      => "string",
        'required'  => false
    ],
    "amendments_relevant_events_matters" => [
        "type"      => "boolean",
        'required'  => false
    ],
    "governing_law" => [
        "type"      => "string",
        'required'  => false
    ],
    "interim_valuation_frequency" => [
        "type"      => "string",
        'required'  => false
    ],
    "payment_due_date" => [
        "type"      => "string",
        'required'  => false
    ],
    "final_date_for_payment" => [
        "type"      => "date",
        'required'  => false
    ],
    "deadline_for_pay_less_notices" => [
        "type"      => "date",
        'required'  => false
    ],
    "schedule_of_payments_provided" => [
        "type"      => "boolean",
        'required'  => false
    ],
    "advance_payment_provision" => [
        "type"      => "boolean",
        'required'  => false
    ],
    "main_contractor_postal_address_for_notices" => [
        "type"      => "string",
        'required'  => false
    ],
    "main_contractor_email_address_for_notices" => [
        "type"      => "string",
        'required'  => false
    ],
    "subcontractor_postal_address_for_notices" => [
        "type"      => "string",
        'required'  => false
    ],
    "subcontractor_email_address_for_notices" => [
        "type"      => "string",
        'required'  => false
    ],
    "date_for_possession_of_site" => [
        "type"      => "string",
        'required'  => false
    ],
    "sectional_completion_dates" => [
        "type"      => "boolean",
        'required'  => false
    ],
    "review_period_for_drawings" => [
        "type"      => "string",
        'required'  => false
    ],
    "advance_warning_period" => [
        "type"      => "string",
        'required'  => false
    ],
    "public_product_insurance_responsible" => [
        "type"      => "string",
        'required'  => false
    ],
    "employer_liabilty_insurance_responsible" => [
        "type"      => "string",
        'required'  => false
    ],
    "professional_indemnity_insurance_responsible" => [
        "type"      => "string",
        'required'  => false
    ],
    "edition_of_jct_contract" => [
        "type"      => "string",
        'required'  => false
    ],
    "schedule_of_amendments_reference" => [
        "type"      => "string",
        'required'  => false
    ],
    "client_contact_name" => [
        "type"      => "string",
        'required'  => false
    ],
    "client_contact_email" => [
        "type"      => "string",
        'required'  => false
    ],
    "client_contact_postal_code" => [
        "type"      => "string",
        'required'  => false
    ],
    "site_constrains" => [
        "type"      => "text",
        'required'  => false
    ],
    "global_date_for_possession" => [
        "type"      => "date",
        'required'  => false
    ],
    "project_sections" => [
        "type"      => "json",
        'required'  => false
    ],
    "version" => [
        "type"      => "integer",
        'required'  => false
    ],
  ];

  /**
   * @codeCoverageIgnore
   * @return \Illuminate\Database\Eloquent\Relations\HasMany
   */
  public function tender(): \Illuminate\Database\Eloquent\Relations\HasMany
  {
    return $this->hasMany(Tender::class, "project_id");
  }

    /**
     * @param array $values
     * @param array $raw
     * @return array
     */
    public function beforeSave(array $values,array $raw): array
    {
        /*
         * If the status provided is different that the one stored in db
         * we need to update the status_updated_at column to know when the status changed
         */
        if(isset($raw['status']) && $raw['status'] != $values['status']) {
            $values['status_updated_at'] = date("Y-m-d H:i:s");
        }
        return $values;
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\hasMany
     */
    public function teamMemberRoleMapping(): \Illuminate\Database\Eloquent\Relations\hasMany
    {
        return $this->hasMany(TeamMemberRoleMapping::class, "project_id");
    }
}
