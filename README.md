poc-rxjs
========

a spike to make RxJS and Socket.io work together

Why ?
-----

My intention here was to better understand in which situations I could use Rx.JS.
Then I realized I could make cool things by capturing some events on one side, by someone called a publisher, and reproduce them somewhere else, called a listener.
So that is the result.

And quite a crappy result, I must admit !
But the experience is here and I learned a lot of things :)
It actually gave some idea that I may give a try.

OK then, how can I use it ?
---------------------------

Get the source code, and run npm install.

Just run api/server.js as a node task (server will listen on 3003), then browse the web/index.html file (I've done it on an Apache instance on my own computer)
I suggest you to open at least 2 windows and place them as you can see both at the same time.
Then, in one of them, register as a "publisher", give a name and wait.
On the other(s), register as a listener and select the publisher you've just created.
Come back to the publisher window and try to write whatever you want in the textarea, and see the magin happens.
You can also try to move the "spike" floating div.

Now what if something bad happens ?
I suggest you to reload the windows and create a publisher and a listener (even for switching roles)
And what if something really bad happens ?
Then stop the node task and launch it again, et reload the windows.

Cool !
------

Yeah, but don't look at the code to closely, you might take a headache because it's really crappy for now.
And fork it !

Enjoy !
