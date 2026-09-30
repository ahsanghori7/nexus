<?php
namespace App\DocCreator;

use setasign\Fpdi\Fpdi as SetasignFpdi;

/**
 * Class PDF
 * @package App\controllers
 */
class FPDI extends SetasignFpdi
{

    /**
     * @var string
     */
    protected string $footer_text = '';

    /**
     * @param string $footer_text
     */
    public function setFooterText(string $footer_text = ''): void
    {
        $this->footer_text = $footer_text;
    }

    /**
     * @return string
     */
    public function getFooterText(): string
    {
        return $this->footer_text;
    }

    public function Footer()
    {
        $this->SetY(-17);
        $this->SetX(17);
        $this->SetFont('Arial','',8);
        $this->Line(18.5,285,191.5,285);
        $this->Cell(0,16,$this->PageNo().' of {nb}',0,0,'L');
        $this->Cell(-7,16,$this->getFooterText(),0,0,'R');
    }
}
