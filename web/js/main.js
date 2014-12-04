var actorType = document.getElementById('actor_type');
var actorTypeChange = Rx.Observable.fromEvent(actorType, 'change');

var socket;

actorTypeChange.forEach(function() {
    if (actorType.value === 'publisher') {
        $('#publisher_name_div').removeClass('hidden');
        $('#publishers_div').addClass('hidden');
        socket = connectToAPI();
    } else if (actorType.value === 'listener') {
        $('#publisher_name_div').addClass('hidden');
        $('#publishers_div').removeClass('hidden');
        socket = connectToAPI(function () {
            socket.filter(function(event) {
                return event.name == 'publishers';
            }).subscribe(function (event) {
                event.data.forEach(function (publisher) {
                    $('#publishers').append('<option value="' + publisher + '">' + publisher + '</option>');
                });
            });
            socket.onNext({
                name: 'publishers'
            });
        });
    }
});

var publisherValidate = document.getElementById('publisher_validate');
var publisherName = document.getElementById('publisher_name');
var publisherValidateClick = Rx.Observable.fromEvent(publisherValidate, 'click');

var textarea = document.getElementById('textarea');
var textareaChange = Rx.Observable.fromEvent(textarea, 'keypress');
var textareaDelete = Rx.Observable.fromEvent(textarea, 'keyup')
    .filter(function(event){
        return event.keyCode === 8;
    });

publisherValidateClick
    .filter(function() {
        return publisherName.value;
    })
    .forEach(function() {
        connectPublisher(publisherName.value);
        $('#textarea_div').removeClass('hidden');
        $('#drawing_div').removeClass('hidden');

        textareaChange.forEach(function(event){
            socket.onNext({
                name: 'write',
                data: String.fromCharCode(event.keyCode)
            });
        });

        textareaDelete.forEach(function(event) {
            socket.onNext({ name:'delete' });
        });
});

function connectPublisher(name) {
    socket.onNext({
        name: 'publish',
        data: name
    });
};

var publishers = document.getElementById('publishers');
var publishersChange = Rx.Observable.fromEvent(publishers, 'change');

var sprite = document.getElementById('sprite'),
    spriteContainer = document.getElementById('canvas');

publishersChange
    .filter(function() {
        return publishers.value && publishers.value != '...';
    })
    .forEach(function(){
        $(textarea).val('');

        socket.filter(function(event) {
            return event.name === 'write'
        }).forEach(function(event) {
            $(textarea).val($(textarea).val() + event.data);
        });

        socket.filter(function(event) {
            return event.name === 'delete'
        }).forEach(function(event) {
            var text = $(textarea).val();
            $(textarea).val(text.substring(0, text.length - 1));
        });

        socket.filter(function(event) {
            return event.name === 'moveSprite'
        }).forEach(function(event) {
            $(sprite).css('left', event.data.pageX);
            $(sprite).css('top', event.data.pageY);
        });

        $('#textarea_div').removeClass('hidden');
        $('#drawing_div').removeClass('hidden');
        socket.onNext({
            name: 'listen',
            data: publishers.value
        });
    });

var spriteMouseDowns = Rx.Observable.fromEvent(sprite, "mousedown"),
    spriteContainerMouseMoves = Rx.Observable.fromEvent(spriteContainer, "mousemove"),
    spriteContainerMouseUps = Rx.Observable.fromEvent(spriteContainer, "mouseup"),
    spriteMouseDrags =
        spriteMouseDowns.concatMap(function(contactPoint) {
            return spriteContainerMouseMoves.
                takeUntil(spriteContainerMouseUps).
                map(function(movePoint) {
                    var newPosition = {
                        pageX: movePoint.pageX - contactPoint.offsetX,
                        pageY: movePoint.pageY - contactPoint.offsetY
                    };

                    socket.onNext({
                        name : 'moveSprite',
                        data: newPosition
                    });

                    return newPosition;
                });
            });

spriteMouseDrags.forEach(function(dragPoint) {
    sprite.style.left = dragPoint.pageX + "px";
    sprite.style.top = dragPoint.pageY + "px";
});

function connectToAPI(onConnect) {
    console.log('connecting...');
    var openObserver = Rx.Observer.create(function () {
        console.log('connected !');
        if (onConnect) {
            onConnect();
        }
    });

    var socket = fromWebSocket('http://localhost:3003', openObserver);
    socket.subscribe(function(event) {
            console.log('event received : ' + event.name);
            console.log(event.data);
        },
        function (err) {
            console.log('Error: ' + err);
        },
        function () {
            console.log('Completed');
        });
    return socket;
}

function fromWebSocket(address, openObserver) {
    var socket = io(address);
    // Handle the data
    var observable = Rx.Observable.create (function (obs) {
        if (openObserver) {
            socket.on('connect', function () {
                openObserver.onNext();
                openObserver.onCompleted();
            });
        }

        // Handle messages
        socket.io.on('packet', function (packet) {
            if (packet.data) obs.onNext({
                name: packet.data[0],
                data: packet.data[1]
            });
        });
        socket.on('error', function (err) { obs.onError(err); });
        socket.on('reconnect_error', function (err) { obs.onError(err); });
        socket.on('reconnect_failed', function () { obs.onError(new Error('reconnection failed')); });
        socket.io.on('close', function () { obs.onCompleted(); });

        // Return way to unsubscribe
        return function() {
            socket.close();
        };
    });

    var observer = Rx.Observer.create(function (event) {
        if (socket.connected) {
            socket.emit(event.name, event.data);
        }
    });

    return Rx.Subject.create(observer, observable);
}