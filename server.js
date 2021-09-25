const express = require("express");
const socketIO = require("socket.io");
const http = require("http");
const path = require('path')

const port = process.env.PORT || 3000;
let app = new express();
app.use(express.static(path.join(__dirname,'app')))
let server = http.createServer(app);
let io = socketIO(server);
let allRooms = [];


io.on('connection',(socket)=>{                                              /* Gets triggered on each new socket connection ( i.e When a new player opens this game )*/
    console.log("+++ Incoming new connection......");
    socket.on("joinroom",async (roomID,callback) => {                       /* Triggers while `joinroom` event is emitted ( i.e When a player wants to join a particular room )*/
        let sockets = await io.in(roomID).fetchSockets();                   /* Fetching all the sockets connected to this particular room ( i.e Gets the players joined in this room ) */
        if(sockets.length != 2){                                            /* Checking whether there are more than 2 sockets connected to this room ( i.e Checking whether there are already 2 players in this room */
            socket.join(roomID);                                            /* Joins the room if there are less than 2 sockets ( i.e Joins if there are only one or no players in the room*/
            if(!(allRooms.indexOf(roomID) > -1)){
                allRooms.push(roomID);                                      /* Storing all the rooms*/
                io.emit('updatedrooms',allRooms);                           /* Triggering `updatedrooms` to update the rooms list*/
            }
            callback(false);                                                /* Sending `false` because the room is not full*/
        }
        else{
            callback(true)                                                  /* Sending `true` because the room is already full*/
        }
    })

    socket.on('getrooms',async (callback)=>{                                /* Getting all the rooms created */
        callback(allRooms)
    })

    socket.on('marked',(markedposition)=>{                                  /* Getting the updated X:Y position of the game board*/
        io.to(markedposition.roomid).emit('updatemarks',markedposition);    /* Emitting the same X:Y position to a specific room id*/
    })

    io.of("/").adapter.on('leave-room',(roomID,socketID)=>{
        console.log(`Socket ${socketID} has left room ${roomID}`);
    })
})

app.get("/game",(req,res)=>{
    res.sendFile('game.html', { root: path.join(__dirname, 'app') })
})
server.listen(port, () => {
    console.log(`App is running on http://localhost:${port}`);
});

