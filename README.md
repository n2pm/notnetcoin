# notnetcoin

to the moon

## setup

```shell
$ sudo -u postgres psql
postgres=# create database notnetcoin;
postgres=# create user notnetcoin with password 'deeznuts47';
postgres=# grant all privileges on database notnetcoin to notnetcoin;
postgres=# alter user notnetcoin createdb;
postgres=# \q

$ cp .env.example .env
$ $EDITOR .env

$ pnpm i
$ pnpx prisma generate
$ pnpx prisma migrate deploy
$ pnpx tsc

$ node ./dist/index
```

then generate a url in discord with the `identify` scope and the redirect url set to what you put in .env
