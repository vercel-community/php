<?php

use Phalcon\Mvc\Micro;

$app = new Micro();

$app->get(
    "/",
    function () {
        echo "<h1>Welcome!</h1>";
    }
);

$app->get(
    "/say/hello/{name}",
    function ($name) use ($app) {
        echo "<h1>Hello! $name</h1>";
        echo "Your IP Address is ", $app->request->getClientAddress();
    }
);

$app->post(
    "/store/something",
    function () use ($app) {
        $name = $app->request->getPost("name");
        echo "<h1>Hello! $name</h1>";
    }
);

$app->notFound(
    function () use ($app) {
        $app->response->setStatusCode(404, "Not Found");
        $app->response->sendHeaders();
        echo "This is crazy, but this page was not found!";
    }
);

$app->handle();
