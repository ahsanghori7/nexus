# DB Migrations
For DB migrations we are using Phinx.
You can find more information about Phinx [here](https://book.cakephp.org/phinx/0/en/index.html).

## Making DB Migrations
How to create a new migration. Run the following command:
```
vendor/bin/phinx create MyNewMigration
```
MyNewMigration is the name of the migration. Please use a descriptive name of the migration.
This will create a new migration file in the db/migrations folder with the given name and preceded by a timestamp.
How to write migrations? Read more [here](https://book.cakephp.org/phinx/0/en/migrations.html).
Example:
```
...
public function change()
{
    // create the table
    $table = $this->table('roff_is_a_payaso');
    $table->addColumn('jesua_too', 'integer')
          ->create();
}
...
```

## Running DB Migrations
To run the migrations, run the following command:
```composer db_migrate```

## Rolling Back DB Migrations
To roll back the last migration applied, run the following command:
```composer db_rollback```

## Checking the Status of DB Migrations
To check the status of the migrations, run the following command:
```composer db_status```

## Extra bits
There is also the added tool phinx-migrations-generator which can be used to generate migrations from an existing database.
You can find more information about phinx-migrations-generator [here](https://github.com/odan/phinx-migrations-generator).
This is also useful when there is a db already in place but phinx was not set up from the beginning.
```shell
vendor/bin/phinx-migrations generate
```
