const Community = require('../models/community');
const User = require('../models/user.js');
const Message = require('../models/message');
const moment = require('moment');
// const Redis = require('ioredis');
// const redis = new Redis();
sendMessage = async (io, socket, newMessage) => {
    const user = await User.findById(socket.userId);
    const community = await Community.findOne({name: socket.room});
    moment.locale('fa');
    const time = moment().add(4, 'h').add(30, 'm').format('HH:mm');
    const message = await new Message({
        user: user._id,
        community: community._id,
        content: newMessage,
        date: time
    });
    await message.save();
    user.messages.push(message);
    community.messages.push(message);
    await user.save();
    await community.save();
    message.user = user;
    io.to(socket.room).emit('getMessage', message);
};
fetchOnlinePerson = async (socket) => {
    const onlineNames = [];
    // await redis.llen('onlineList:' + socket.room).then(async len => {
    //     for (let i = 0; i < len + 1; i++) {
    //         await redis.lindex('onlineList:' + socket.room, i).then(id => {
    //             redis.get(id).then(name => {
    //                 if (name) {
    //                     onlineNames.push({name: name, _id: id})
    //                 }
    //             })
    //         })
    //     }
    //
    // });
    return onlineNames;
};
exports.allocateRoom = async (io, socket, {room, userId, name}) => {
    console.log(userId + ' added to ' + room + ' room');
    socket.room = room;
    socket.userId = userId;
    socket.join(room);
    // redis.get(userId).then(async r => {
    //
    //     if (!r) {
    await sendMessage(io, socket, 'join in community !!');
    //         redis.set(userId, name).then(r => {
    //         });
    //         redis.rpush('onlineList:' + socket.room, userId).then(r => {
    //         });
    //     }
    let community = await Community.findOne({name: room});
    const user = await User.findById(userId);
    community.onlinePerson.push(user);
    await community.save();
    // const onlineNames = await fetchOnlinePerson(socket);
    community = await Community.findOne({name: socket.room}).populate('onlinePerson');
    const onlineNames = community.onlinePerson;
    io.to(socket.room).emit('online', onlineNames);
    //
    // });
};
disconnect = async (io, socket) => {

    await sendMessage(io, socket, 'has left the community');
    let community = await Community.findOne({name: socket.room});
    const user = await User.findById(socket.userId);
    community.onlinePerson = await community.onlinePerson.filter(p => {
        return p != socket.userId;
    });
    await community.save();
    // await redis.llen('onlineList:' + socket.room).then(async len => {
    //     for (let i = 0; i < len + 1; i++) {
    //
    //         await redis.rpop('onlineList:' + socket.room).then(async id => {
    //
    //             if (id !== socket.userId) {
    //                 await redis.lpush('onlineList:' + socket.room, id).then(() => {
    //                 });
    //             } else {
    //                 await redis.del(id);
    //
    //
    //             }
    //         })
    //     }
    // });
    community = await Community.findOne({name: socket.room}).populate('onlinePerson');
    const onlineNames = community.onlinePerson;
    io.to(socket.room).emit('online', onlineNames);

};
exports.sendMessage = sendMessage;
exports.disconnect = disconnect;
exports.fetchOnlinePerson = fetchOnlinePerson;
