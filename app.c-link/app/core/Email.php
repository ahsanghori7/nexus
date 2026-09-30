<?php
namespace App\core;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class Email {

     public $html = [];
     public $cc = [];
     public $bcc = [];
     public $to = [];
     public $to_replaced = [];
     public $from = [];
     public $preview = false;
     public $data = [];
     public $attachments = [];
     public $subject = '';
     public $type = '';
     public $email_info = false;
     public $debug = false;
     public $header = '';
     public $footer = '';
     public $template = '';
     public $admin_prosper = '';
     public $admin_clink = '';
     public $to_original = '';

    /**
     * @var bool
     */
     protected bool $useHeaderFooter = true;

  /**
   * Email constructor.
   */
  public function __construct(){
       $this->admin_prosper = config('email.prosper.default.email');
       $this->admin_clink = config('email.clink.default.email');
     }

  /**
   * @return string
   */
  private function _getHTML(): string
     {
         $html = "";
         if($this->useHeaderFooter) {
             $html .= $this->html['header'] ?? '';
         }
         $html .= $this->html['content'] ?? '';
         if($this->useHeaderFooter) {
             $html .= $this->html['footer'] ?? '';
         }
         return $html;
     }

    /**
     * @param bool $state
     * @return $this
     */
     public function useHeaderAndFooter(bool $state) : Email {
        $this->useHeaderFooter = $state;
        return $this;
     }

  /**
   * @return mixed
   */
  private function _getFrom()
     {
         $from['email'] = $this->from['email'] ?? config('email.clink.default.email');
         $from['name'] =  $this->from['name'] ?? '';

         return $from;
     }

  private function _previewHtml(): void
     {
        $preview = '';
        if($this->email_info){
            $from = $this->_getFrom();
            $subject = $this->getSubject();
            $preview .= 'Subject: '. $subject. '<br/>';
            $preview .= 'From: '. $from['email']. ' '. $from['name']. '<br/>';
            $preview .= 'To: '. implode(', ', $this->to). '<br/>';
            if($this->to_replaced) {
              $preview .= 'To Email DEBUG: ' . $this->to_replaced . '<br/>';
            }
            if(!empty($this->cc)){
                foreach($this->cc as $cc_email => $cc_name):
                    $preview .= 'CC: '. $cc_email . ': ' . $cc_name . '<br/>';
                endforeach;

            }

            $preview .= 'Header: '. $this->header . '<br/>';
            $preview .= 'Template: '. $this->template . '<br/>';
            $preview .= 'Footer: '. $this->footer . '<br/>';

            var_dump($this->data);

        }

        if(is_array($this->html)) {
            $content = $this->html["content"] ?? "";
        }
        else {
            $content = $this->html;
        }

        $preview .= $content;
        echo '<div style="width:1000px;position:relative;margin:0px auto;">';
        echo $preview;
        echo '</div>';

        $this->_reset();

         /*
          * We want to die here as we only want to preview the email
          */
         exit;
     }

     private function _reset(): void
     {
        $this->data = [];
        $this->to = [];
        $this->cc = [];
        $this->bcc = [];
        $this->html = [];
        $this->header = '';
        $this->footer = '';
        $this->subject = '';
        $this->template = '';
        $this->to_replaced = '';
        $this->attachments = [];
        $this->debug = false;
     }

    /**
     * @param array $attachments
     */
     public function addAttachment(array $attachments): void
     {
        foreach($attachments as $attachment){
            $this->attachments[] = $attachment;
        }
     }

    /**
     * @return array
     */
     public function getAttachments(): array
     {
         return $this->attachments;
     }

     private function _sendEmail(): ?bool
     {

         require BASE_DIR . "/vendor/autoload.php";

         $mail             = new PHPMailer();

         $mail->IsSMTP();

         if($this->debug){
            $mail->SMTPDebug  = 1;
         }

         $mail->CharSet = "UTF-8";
         $mail->SMTPAuth   = config('email.smtp.auth');
         $mail->SMTPSecure = Config('email.smtp.secure');
         $mail->Host       = Config('email.smtp.host');
         $mail->Port       = Config('email.smtp.port');
         $mail->Username   = Config('email.smtp.username');
         $mail->Password   = Config('email.smtp.password');

         $this->html = $this->_getHTML();

         $subject = $this->getSubject();
         $from = $this->_getFrom();

         if(config('debug.email.debug')){
            $this->to_replaced = config('debug.email.to');
         }

         //if we want to preview the email
         if($this->preview){
            $this->_previewHtml();
         }

         if(!isset($this->to) || !isset($from['email'])){
            return null;
         }

         $mail->setFrom($from['email'], $from['name']);

         if(isset($this->to_replaced) && $this->to_replaced){
            $this->to = $this->to_replaced;
         }

         if(is_array($this->to)){
            foreach($this->to as $value):
                $mail->addAddress($value, '');
            endforeach;
         }else{
            $mail->addAddress($this->to, '');
         }

         if(is_array($this->cc)){
            foreach($this->cc as $email => $name):
                if(config('debug.email.cc')){
                    $email = config('debug.email.cc');
                }
                $mail->addCC($email, $name);
            endforeach;
         }

         if(is_array($this->bcc)){
            foreach($this->bcc as $email => $name):
                if(config('debug.email.bcc')){
                    $email = config('debug.email.bcc');
                }
                $mail->addBCC($email, $name);
            endforeach;
         }

         foreach($this->getAttachments() as $attachment){
             $mail->addAttachment($attachment);

         }

         $mail->isHTML(true);
         $mail->Subject = $subject;
         $mail->Body    = $this->html ?? '';

         if(!$mail->Send()) {
            throw new \Exception("Email couldn't be sent to ");
         }

         $this->_reset();

         return true;
     }

     public function addToQueue(): void
     {
        prd("queue");
     }

  /**
   * @param string $template
   * @param array $data
   */
  public function htmlHeader($template = 'prosper', $data = []): void
     {
        $this->header = views_path() . "emails/headers/".$template.'-header.php';
        $this->html['header'] = app()->view->render($this->header);
     }

  /**
   * @param string $template
   * @param array $data
   */
  public function htmlFooter($template = 'prosper', $data = []): void
     {
        $this->footer = views_path() . "emails/footers/".$template.'-footer.php';
        $this->html['footer'] = app()->view->render($this->footer);
     }

  /**
   * @param string $template
   */
  public function htmlContent($template = '')
     {
        $type = $this->getType();
        if($type){
            $this->template = views_path() . "emails/templates/" . $type . '/' . $template . '.php';
        }else{
            $this->template = views_path() . "emails/templates/" . $template . '.php';
        }
        $this->html['content'] = app()->view->render($this->template, $this->data[$template]);

        return $this;
     }

  /**
   * @param string $header
   * @param array $data
   */
  public function header($header = '', $data = []): void
     {
        if(!$header){
            $header = $this->type;
        }
        $this->htmlHeader($header, $data);
     }

  /**
   * @param string $footer
   * @param array $data
   */
  public function footer($footer = '', $data = []): void
     {
        if(!$footer){
            $footer = $this->type;
        }
         $this->htmlFooter($footer, $data);
     }

    /**
     * @param string $template
     * @param array $data
     */
    public function template($template = '', $data = [])
    {
        $this->data[$template] = $data;
        $this->htmlContent($template);
        return $this;
    }

  /**
   * @param array $data
   */
  public function data(array $data = []): void
     {
         $this->addData($data);
     }

  /**
   * @param array $data
   */
  public function addData(array $data = []): void
     {
         $this->data = $data;
     }

    /**
     * @param string $subject
     */
    public function subject(string $subject = '')
    {
        $this->subject = e_html('=?UTF-8?B?'.base64_encode($subject).'?=');
        return $this;
    }

    /**
     * @return string
     */
    public function getSubject(): string
    {
        return e_html($this->subject);
    }

  /**
   * @param string $type
   */
  public function type($type = ''): void
     {
         $this->type = $type;
         $this->header($this->type);
         $this->footer($this->type);
     }

    /**
     * @param string $type
     * @return $this
     */
    public function setType(string $type)
    {
        $this->type = $type;
        return $this;
    }

  /**
   * @return string
   */
  public function getType(): string
     {
         if(!$this->type){
            $this->type = '';
         }
         return $this->type;
     }

  /**
   * @param string $email
   */
  public function to($email = ''): void
     {
        if(is_array($email)){
            foreach($email as $value):
                if(filter_var($value, FILTER_VALIDATE_EMAIL)){
                    $this->to[$value] = $value;
                }
            endforeach;
        }else{
            if(filter_var($email, FILTER_VALIDATE_EMAIL)){
                if(!is_array($this->to)){
                    prd($this->to);
                }
                $this->to[$email] = $email;
            }
        }
     }

  /**
   * @param string $email
   * @param string $name
   */
  public function from($email = '', $name = ''): void
     {
         $this->from['email'] = $email;
         $this->from['name'] = $name;
     }

  /**
   * @param string $email
   * @param string $name
   */
  public function cc(string $email = '', string $name = ''): void
     {
         $this->cc[$email] = $name;
     }

  /**
   * @param string $email
   * @param string $name
   */
  public function bcc(string $email = '', string $name = ''): void
     {
         $this->bcc[$email] = $name;
     }

  /**
   * @throws \Exception
   */
  public function send($to=null, $from=null): void
     {
         if($to) { $this->to($to); }
         if($from) { $this->from($from); }



        $this->_sendEmail();
     }

  /**
   * @param false $email_info
   * @throws \Exception
   */
  public function preview($email_info = false): void
     {
        $this->preview = true;
        $this->email_info = $email_info;
        $this->_sendEmail();
     }

    /**
     * Bit wacky, but the preview function tries to send the email as well...
     */
     public function showPreview() {
         $this->_previewHtml();
     }


  /**
   * @throws \Exception
   */
  public function debug(): void
     {
        $this->debug = true;
        $this->to_original = $this->to;
        $this->to = [];
        $this->to[config('debug.email.to')] = config('debug.email.to');
        $this->_sendEmail();
     }

  /**
   * @param string $type
   * @param string $email
   * @param array $data
   */
  public function queue(string $type = 'prosper', string $email = '', $data = []): void
     {
        $data['header'] = 'admin';
        $data['footer'] = 'admin';
        $data['preview'] = true;
        $this->addToQueue();
     }
 }
