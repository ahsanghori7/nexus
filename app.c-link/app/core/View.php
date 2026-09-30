<?php
namespace App\core;

use App\core\Config;
use App\core\Controller;
use App\core\Html\Element;

class View {

    public $js_offset = 22;
    public $controller;
    public $shortcodes = [];
    public $shortcodes_in_use = 0;
    public $layouts = [];
    protected $_jsLibs = [];
    protected $_cssLibs = [];

    protected $context = [];

    /**
     * @var bool
     */
    protected $reactView = false;

    public function __construct(Controller $controller)
    {
        $this->controller = $controller;
        $url = $this->controller->request->url;
        $old_nav_urls = ['cost-planning-tool', 'profile', 'sign-up-from-team', 'new-password', 'reset-success'];
        $found = false;
        foreach ($old_nav_urls as $substring) {
            if (strpos($url, $substring) !== false) {
                $found = true;
                break;
            }
        }

        if ($found) {
            $this->renderAddHeaderLayout('header-top', 'header-top.php');
            $this->renderAddLayoutEnd('footer-libs', 'footer-libs.php');
        } else {
            $this->renderAddHeaderLayout('header-top', 'header-top-v2.php');
        }
    }

    public function addCssLib(string $lib)
    {
        array_push($this->_cssLibs, $lib);
    }

    /**
     * @param string $file
     * @throws \Exception
     */
    public function getSnippet(string $file) {
        if(!str_ends_with($file, ".php")) {
            $file .= ".php";
        }
        $full = sprintf("%ssnippets/%s", views_path(), $file);
        if(!is_file($full)) {
            throw new \Exception("Missing Snippet $full");
        }

        include($full);
    }

    /**
     * @return bool
    */
    public function luckyOrangeEnabled()
    {
      return (Environment::isProduction() && Environment::getValue('LUCKYORANGE_ENABLED'));
    }

    /**
     * @return mixed
     */
    public function getLuckyOrangeSiteId()
    {
      return Environment::getValue("LUCKYORANGE_SITE_ID");
    }

    /**
     * @return bool
     */
    public function googleTagManagerEnabled()
    {
        return (Environment::isProduction() && Environment::getValue('GOOGLE_TAG_MANAGER_ENABLED'));
    }

    /**
     * @return bool
     */
    public function noFollowTags()
    {
        return (!Environment::isProduction() && Environment::getValue('NO_FOLLOW_NO_INDEX'));
    }

    /**
     * @return mixed
     */
    public function getGoogleTagManagerId()
    {
        return Environment::getValue('GOOGLE_TAG_MANAGER_ID');
    }

    /**
     * @ToDo move react logic into its own class
     * @return $this
     */
    public function enableReact() {
        $this->reactView = true;
        return $this;
    }

    /**
     * @return bool
     */
    public function reactEnabled() {
        return ($this->reactView === true);
    }

    /**
     * @return string|null
     */
    public function getReact() {

        return Environment::getValue("REACT_JS");
    }

    /**
     * @return string|null
     */
    public function getReactDom() {
        return Environment::getValue("REACT_DOM_JS");
    }

    /**
     * @param null $k
     * @param null $def
     * @return array|mixed|null
     */
    public function getContext($k = null, $def=null) {
        if($k) {
            return $this->context[$k] ?? $def;
        }
        return $this->context;
    }

    /**
     * @param array $data
     */
    public function setContext(array $data) {
        $this->context = array_merge($data, $this->context);
        return $this;
    }

    /**
     * @param $key
     * @param $data
     * @return $this
     */
    public function setContextItem($key, $data) {
        $this->context[$key] = $data;
        return $this;
    }

    /**
     * @param string $prefix
     * @return string
     */
    public function getSiteUrl(string $prefix ="") :string {
        $url = rtrim(SITE_URL , "/") . "/";
        if($prefix) {
            $url .= ltrim($prefix. "/");
        }
        return $url;
    }

        /**
     * @param string $type
     * @param array $elements
     * @param string $context
     */
    public function setContextElements(string $type, array $elements, string $context="") {
        $objects = [];
        foreach ($elements as $tag => $element) {
            //If Element is not array, assume has no attributes and is only content
            $data = is_array($element) ? $element : [[], $element];
            if(!is_string($tag)) {
                $tag = $type;
            }

            $objects[] = new Element($tag, $element[0] ?? [], $element[1] ?? "");
        }

        $this->setContextItem(($context) ? $context : $type, $objects);
    }

    public function renderCssLibs()
    {
        $this->_cssLibs = array_unique($this->_cssLibs);
        foreach($this->_cssLibs as $file):
            ?><link rel="stylesheet" href="<?php echo $file ?>"><?php echo "\n";
        endforeach;
    }

    public function addJsLib(string $lib)
    {
        array_push($this->_jsLibs, $lib);
    }

    public function renderJsLibs()
    {
        $this->_jsLibs = array_unique($this->_jsLibs);
        foreach($this->_jsLibs as $file):
            ?><script src="<?php echo $file ?>"></script><?php echo "\n";
        endforeach;
    }

    /**
     * @param $file
     * @param null $data
     * @return false|string
     */
    public function renderBuffer($file,$data=null) {
        $buffer = '';
        if(file_exists($file)) {
            if(!empty($data)) {
                extract($data);
            }
            ob_start();
            include $file . "" ;
            $buffer = ob_get_clean();
        }
        else {
            throw new \Exception("Invalid path supplied for render $file");
        }
        return $buffer;
    }

    public function render($filePath, $data = null)
    {
        $renderedFile = $this->renderBuffer($filePath, $data);
        if($renderedFile) {
            $this->controller->response->setContent($renderedFile);
        }
        return $renderedFile;
    }

    /**
     * @param $template
     * @param string $type
     * @param null $data
     * @throws \Exception
     */
    public function getTemplate($template, $type="", $data=null) {
        $path = sprintf("%stemplates/%s", views_path(), $type);
        if(!is_dir($path)) {
            throw new \Exception("Invalid template path $path");
        }

        $full = str_replace("//", "/", $path ."/". $template . '.php');
        if(!is_file($full)) {
            throw new \Exception("Invalid template path $full");
        }

        return $this->renderBuffer($full, $data);
    }

    public function renderAddLayoutEnd($layout_key = null, $layout_page = null)
    {
        if(isset($layout_key) && isset($layout_page)){
            $this->layouts['footer_libs'][$layout_key] = $layout_page;
        }
    }

    public function renderAddFooterLayout($layout_key = null, $layout_page = null)
    {
        if(isset($layout_key) && isset($layout_page)){
            $this->layouts['footer'][$layout_key] = $layout_page;
        }
    }

    public function renderAddHeaderLayout($layout_key = null, $layout_page = null)
    {
        if(isset($layout_key) && isset($layout_page)){
            $this->layouts['header'][$layout_key] = $layout_page;
        }
    }

    public function renderRemoveLayout($type = null, $key = null)
    {
        if(isset($key) && isset($type) && isset($this->layouts[$type][$key]))
        {
            unset($this->layouts[$type][$key]);
        }
    }

    public function renderWithLayouts($layoutDir, $filePath, $data = null, $file = '', $file_url = '')
    {
        if(!is_dir($layoutDir)){
            mkdir($layoutDir, 0777, true);
        }

        if(!empty($this->controller->shortcode->shortcodesOptions)){
            $data = $this->controller->shortcode->shortcodesOptions;
        }

        ob_start();

        if(isset($this->layouts['header']) && is_array($this->layouts['header'])){
            foreach($this->layouts['header'] as $key => $value):
                if(file_exists($layoutDir . $value)){
                    require_once $layoutDir . $value;
                }
            endforeach;
        }

        $this->renderCssLibs();

        if(file_exists($filePath)){
            require_once $filePath;
        }

        if(isset($this->layouts['footer']) && is_array($this->layouts['footer'])){
            foreach($this->layouts['footer'] as $key => $value):
                if(file_exists($layoutDir . $value)){
                    require_once $layoutDir . $value;
                }
            endforeach;
        }

        $this->renderJsLibs();

        if(isset($this->layouts['footer_libs']) && is_array($this->layouts['footer_libs'])){
            foreach($this->layouts['footer_libs'] as $key => $value):
                if(file_exists($layoutDir . $value)){
                    require_once $layoutDir . $value;
                }
            endforeach;
        }

        $renderedFile = ob_get_clean();

        $this->controller->response->setContent($renderedFile);

        return $renderedFile;
    }

    public function getMessages() {
        return \App\core\Session::get("messages");
    }

    public function cleanMessages() {
        \App\core\Session::set("messages", []);
    }

    public function renderJson($data){
        $jsonData = $this->jsonEncode($data);
        $this->controller->response->type('application/json')->setContent($jsonData);
        return $jsonData;
    }

    public function jsonEncode($data){
        return json_encode($data);
    }

    public function truncate($str, $len){

        if(empty($str)) {
            return "";
        }else if(mb_strlen($str, 'UTF-8') > $len){
            return mb_substr($str, 0, $len, "UTF-8") . " ...";
        }else{
            return mb_substr($str, 0, $len, "UTF-8");
        }
    }

    public function timestamp($timestamp){

        $unixTime = strtotime($timestamp);
        $date = date("F j, Y", $unixTime);

        //if date() failes it will return false
        return (empty($date))? "": $date;
    }

    public function unixtime($unixtime){

        $date = date("F j, Y", intval($unixtime));
        return (empty($date))? "": $date;
    }

    public function encodeHTML($str){

        return htmlentities((string)$str, ENT_QUOTES, 'UTF-8');
    }
}
