<?php
    declare(strict_types=1);

    namespace App\Domain\Website;

    use App\Domain\AbstractRepository;
    use App\Domain\Website\Website;

    /**
     * Class WebsiteRepository
     * @package App\Domain\Website
     */
    class WebsiteRepository extends AbstractRepository
    {
        /**
         * @var string[]
         */
        protected $models = [
            "website" => Website::class
        ];

        /**
         * @return Website
         */
        public function getModel(string $model = "website")
        {
            $cls = $this->models[$model] ?? false;
            if (!$cls) {
                throw new \Exception("Invalid Model $model");
            }
            return new $cls();
        }
    }
