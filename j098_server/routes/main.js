const express = require('express');
const router = express.Router();
const db = require('../database/MyDB')
const DAY = 1000*60*60*24;
const auth = require('../middleware/auth')

router.get('/', async (req, res, next) => {
    const user = (req.user)? req.user: null;
    res.render('main', { user: user});
});

// 주소, 체크인, 체크아웃, 인원
// address, check_in, check_out, personnel
router.post('/search',async (req, res, next) => {
    const { address, check_in, check_out, personnel} = req.body;
    //1. 검색 주소와 인원에 맞는 숙소를 먼저 검색
    const rooms = await db.find('rooms',['address','capacity'],['like','>='],[address,personnel]);

    //2. 검색된 숙소중에서 해당 기간에 예약이 있는지 확인
    const reserved = await db.find('reserved');

    const checkIn = new Date(check_in);
    const checkOut = new Date(check_out);
    const nights = (checkOut.getTime() - checkIn.getTime()) / DAY;

    const searchResult = [];
    rooms.forEach(room => {
        const booking = reserved.filter(reservation => reservation.room_id == room.id);
        for(let i=0;i<booking.length;i++){
            const bookingCheckIn = new Date(booking[i].check_in).getTime();
            const bookingCheckOut = new Date(booking[i].check_out).getTime();

            // 검색한 체크인, 체크아웃 기간에 이미 예약이 있다면 return
            if (checkIn.getTime() <= bookingCheckIn && bookingCheckIn < checkOut.getTime()){
                return;
            } else if (checkIn.getTime() < bookingCheckOut && bookingCheckOut <= checkOut.getTime()){
                return;
            }
        }
        const price = getPrice(room, checkIn, nights);
        room.price = price;
        room.nights = nights;
        searchResult.push(room);
    })
    const searchOption = {
        address: address, 
        check_in: check_in, 
        check_out: check_out, 
        personnel: personnel
    }
    res.render('search', { user: req.user, searchOption: searchOption, roomList: searchResult})
})


router.post('/reserve', auth,async (req, res, next) => {
    const reservePost = JSON.parse(req.body.reserveInfo)
    await db.insert('reserved', reservePost)

    res.send('<script type="text/javascript"> alert("예약이 완료되었습니다."); history.back();</script>');
})


function getPrice(room, checkIn, nights){
    let price = 0;
    let start = checkIn.getDay(); // 요일

    for (let i = 0; i < nights; i++) {
        const day = (start + i) % 7;
        if (day >= 5) price += room.weekend_price;
        else price += room.weekday_price;
    }
    return price;
}

module.exports = router;