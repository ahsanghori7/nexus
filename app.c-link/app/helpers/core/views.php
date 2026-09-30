<?php

    if (!function_exists('shortcode_css')) {
        function shortcode_css()
        {
            //TODO if we dont have any shortcodes in the page we dont need to include the shortocdes files
            //echo '<link rel="stylesheet" href="' . config('shortcode.css') . '?=' . sha1(microtime()) . '" />';
        }
    }

    if (!function_exists('footer_libs')) {
        function footer_libs()
        {

            //TODO if we dont have any shortcodes in the page we dont need to include the shortocdes files

            echo '<script type="text/javascript" src="' . SITE_URL . '/static/js/js.js?=' . sha1(microtime()) . '"></script>';
            echo "\n";
            //echo '<script type="text/javascript" src="' . config('shortcode.js') . '?=' . sha1(microtime()) . '"></script>';
            //echo "\n";

            if (isset(app()->user_path) && app()->user_path !== '') {
              /*
               * @TODO throw an error if the user path is not defined
               * Dashboard files
               */
              if (\App\core\Environment::getValue("NAVBAR_ICON", false)) {
                echo '<script type="module" type="text/javascript" src="' . SITE_URL . '/static/users/' . app()->user_path . '/js/webcomponents/comms-icon/main.js"></script>';

              }
            } else {
              /*
               * Front end files
               */
                echo '<script type="text/javascript" src="' . SITE_URL . '/static/js/page.js?=' . sha1(microtime()) . '"></script>';
            }
        }
    }

    if (!function_exists('views_path')) {
        function views_path()
        {
            return config('path.views') ?? NULL;
        }
    }

    if (!function_exists('public_path')) {
      function public_path()
      {
        return config('path.public') ?? NULL;
      }
    }

    if (!function_exists('pages_path')) {
        function pages_path()
        {
            return views_path() . 'pages/';
        }
    }

    if (!function_exists('static_path')) {
        function static_path(string $path = '')
        {
            $path = ltrim($path, "/");
            $static_path = FILES_PATH . "static/" . $path;
            return $static_path;
        }
    }

    if (!function_exists('default_path')) {
        function default_path()
        {
            $default_path = static_path() . "default/";
            return $default_path;
        }
    }

    if (!function_exists('dashboard_static_path')) {
        function dashboard_static_path(string $path = '')
        {
            if (!$path) {
                $path = app()->user_path;
            }
            $static_path = FILES_PATH . $path . "/" . config('static_dashboard');
            return $static_path;
        }
    }

    if (!function_exists('render')) {
        function render($template = null, $data = null)
        {
            $filePath = pages_path() . $template . ".php";
            app()->view->render($filePath, $data);
        }
    }

    if (!function_exists('removeLayout')) {
      /**
       * @param string $type
       * @param string $page
       */
      function removeLayout (string $type, string $page): void
      {
        app()->view->renderRemoveLayout($type,$page);
      }
    }

    if (!function_exists('renderLayouts')) {
        function renderLayouts($file = null, $data = null)
        {

            $templatePath = views_path();
            $jsURL = config('path.js.pages') . $file . '.js';

            if (app()->user_path != '') {
                $templatePath = views_path() . "users/" . app()->user_path . '/';
                $jsURL = config('path.js.users') . app()->user_path . '/js/' . $file . '.js';
            }

            $layoutDir = $templatePath . "layout/";
            $filePath = $templatePath . "pages/" . $file . ".php";
            $jsPath = public_path() . "js/" . $file . ".js";

            if (app()->user_path != '') {
              $jsPath = public_path() . "users/" . app()->user_path ."/js/" . $file . ".js";
            }
            if(isset($data['template_path'])){
                $filePath = sprintf("%susers/%s/pages/%s.php", views_path(), $data['template_path'], $file);
            }
            app()->view->renderWithLayouts($layoutDir, $filePath, $data, $jsPath, $jsURL);
        }
    }

    if (!function_exists('addCssLib')) {
        function addCssLib($file = null)
        {
            app()->view->addCssLib($file);
        }
    }

    if (!function_exists('addJsLib')) {
        function addJsLib($file = null)
        {
            app()->view->addJsLib($file);
        }
    }

    if (!function_exists('pageData')) {
        function pageData($file = null)
        {
            prd(app()->view);
        }
    }

    /**
     * Concat a uri with a configured site base url
     * @param string $site
     * @param string $uri
     * @param array $params
     * @return string
     * @throws Exception
     */
    function getUri(string $site, string $uri = "", array $params = []) : string
    {
        $url = getSiteUrl($site) . "/" . $uri;
        if ($params) {
            $url .= "?";
            foreach ($params as $k => $v) {
                $url .= "$k=$v";
            }
        }
        return $url;
    }

    /**
     * @param string $site
     * @return string
     * @throws Exception
     */
    function getSiteUrl(string $site) : string
    {
        $url = config("sites.$site");
        if (!$url) {
            throw new \Exception("Unknown Site $site");
        }

        return $url;
    }
