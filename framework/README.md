# Framework

### Overview

The framework repo exists to supply a single lightweight session gateway between the React presentation layer
and the backend services. The codebase aims to reuse a set of core objects and pattens across multiple apps and
rely on a webserver to pass a flag to know which app to render.

The framework is structured as such:

    ├── public                  # Main Web root
        ├── index.php           # Main entry point
    ├── docs                    # Documentation files
    ├── src                     # Source files
        ├── core                # Core code shared by all apps
        ├── admin               # Admin code
        ├── clink               # C-Link App code
        └── prosper             # Prosper App code
    ├── .env                    # Global Config File
    ├── .gitignore              # Git Ignore
    ├── app.constants.php       # Global PHP app constants
    ├── core.neon               # PHP stan global linting rules
    └── README.md

The Core Code source is structured as such:

    ├── core
        ├── bootstrap.php       # Pre loading logic,
        ├── config              # Config directory
            ├── global.php      # Global config values
            └── services.php    # Global service config
        └── code
            ├── Data            # Package for generic data handling objects
            ├── Layer           # Transport layer interfaces
            ├── Middlware       # Global Middleware objects and Exceptions
            ├── Router          # Route and Action logic
            ├── Service         # Service communications
            ├── System          # System control of handlers and events
            ├── Util            # Utilitly helper objects
            ├── Config.php      # Expose config via static property
            └── Router.php      # Expose routes via static property

An Example App Code source is structured as such:

    ├── core
        ├── index.php        # App entry point, would include core bootstrap
        ├── .env             # App config vars
        ├── composer.json    # Composer setup for app dependancies
        ├── config           # Config directory
            ├── app.php      # app config
            └── routes.php   # application routes
        ├── templates        # App Html templates
        └── code
            └── Middleware   # App level middleware

More information about application structure can be found in the class diagram overviews in the documents folder and repo wiki

### Specs
- Language: PHP 8.0
- Linting : PHPStan
- Unit tests: PHPunit

### Core Concepts

- Data Shape : Generic all-purpose data container and the top level abstraction of most objects in the core codebase
  - Shape Value: Allow the inspection and evaluation of a single value
  - Shape Mixin: Allow additional functionality for getters and setters via callbacks
- Data Collection: Container for multiple shapes with high level filtering
- Middleware: Simple callback elements used to improve routing
- Layer: Single interface to exchange Input and output mechanisms

### Install

Make sure that you already have Pandora working by following the documentation in the pandora repo.

    https://github.com/construction-link/pandora/blob/main/README.md

If Pandora is running in your local, run the following command to install app.prosper

    ./bin/install app.prosper

### Configuration

Site config needs to be installed via the global core config object, this is achieved by separating config into independent php files that return arrays of data which are set into this object via

    Core\Config::update( require_once("config/app.php") );

The update method will attempt to merge config and replace keys not blanket override config, attempting to keep the hierarchy set out by the global config.
No values should be hardcoded in these config files where possible, instead rely on environment values supplied by the core system environments class

Load a .env file from a directory

    Core\System\Environment::loadEnv(__DIR__); -> Not anymore :D

Get a config value

    Core\System\Environment::get("SITE_URL")

### Routing

Routes are stored in config and loaded and processed by the Core\Router class. Routing can be broken into two areas
#### Routes:
These are top level patten matching objects for request handling, they are defined by there type which is used to match against an incoming request object
For instance

      "logout" => [
          "onError" => [
            "authError"      => $loginRedirect,
          ],
          "type" => "http",
          "middleware" => [... list of callable objects]
      ]

This route will match any http request where the first part of the uri is logout, on success match a route will then attempt to match an action
any middleware defined at this level will be run by default for all actions.
Route can also have a onError property that will match an error id from a middleware exception and then use a callback handler to react to this
in the example above, if the logout middleware throws an exception with an id of authError, then the callback function defined in $loginRedirect will be called
and send a redirect response to the client sending them to the login page.

#### Actions

Actions are defined in a child array structure of a route as seen below:

      "logout" => [
          "type" => "http",
          "middleware" => [... list of callable objects]
          "actions" => [
            ["key" => "index",
                "middleware" => []
            ],
          ]
      ]

Here a key property is used in a regular expression match against the rest of the incoming request path.
Actions can have their own middleware and onError property but will inherit these as well from the parent route
Here the key index is used as a special match for default if the request path has no uri to match

### Middleware

There are designed to be very simple callback objects that alter the state of the action object that is passed to it, anything set in the middleware array for a route of an action will only be called on match and execution of that action
and either add more data to an action, alter existing data or throw an exception to stop the callstack of middleware for that action.

As of writing this there 4 Core Middleware parent classes defined:

- Form : Form Validation and processing
- Session : Session checks and initiation
- TemplateLoader : Loads a html template into the action response
- Generic : Helper callback functions of wrappers

Middleware should throw a special exception to end the propagation of any further middleware and include an id which can be used to connect to further calls back designed to handle them
for example in this validation check below, an action or data shape is passed to a function, the callback checks the data shape for a form
if there is post data it is validated by a special form validation class, if this fails it throws an exception that can be dealt.

    /**
     * @param Validation $validation
     * @return Callable
     */
    public static function validate(Validation $validation) : Callable {
        return function(Shape $shape) use ($validation) {
            $form = $shape->get("route.request")->get("form");
            if($form) {
                try {
                    $validation->test($form);
                }
                catch (\Exception $e) {
                    throw new Exception("formValidation", "Form Failed validation");
                }
            }
            else {
                throw new Exception("formValidation", "Missing Form Data");
            }
        };
    }

### Services

Services need to be registered with the Global ServiceManager class at bootstrap with an id
For instance the core/config/services.php returns an array that is autoloaded into the ServiceManager

    return [
      "account"  => new RestService(Config::getArray("services.account")),
    ];

Here a RestService Object is used for the account service with the config being loaded into the constructor

Now this service can be called via

    ServiceManager::get("account")

More info can be found about services abstraction layer in the wiki (if it's been built) or in the class diagrams in the documents folder

### Exception and Event Handling

Specific events are emitted thought the callstack via the Core/System/Control object which checks for pre set listerners to react to them
These events allow app level handlers to manage exceptions as well as other hooks to customize the response

the Core/System/Control object also allows for a shutdown handled to be registered with the key shutdown

As of writing this these where the events in execution order:

#### Core

- CoreBootstrapFailure : fired in event of core configuration exception
- PreRoute : Fired prior to any route matching and is passed the incoming request object as an argument
- RouteException : Fired in case of an unhandled exception and is passed the action matched with the request
- PostActionMiddleware : Fired after all action and route middleware has been executed

#### Admin

- PostRequest : Fired after a response has been sent and after Core/Router::exec
- CriticalSystemException : Fallback mechanism for any unhandled events


## Code Quality Checks

This project includes a variety of development tools to help maintain code quality and consistency. From the **core** folder:

- **prettify**: Uses PHP-CS-Fixer to automatically correct code to match the project's coding standards.
  > Usage: `composer prettify`
- **prettify-check**: Checks the code against the project's coding standards without making any changes using PHP-CS-Fixer.
  > Usage: `composer prettify-check`
