var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers=require('../helpers/user-helpers')
const verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
    next()
  }
  else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',async function(req, res, next) {
  let user=req.session.user
  console.log(user)
  let cartCount=null
  if(req.session.user){
  cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products)=>{
    res.render('user/view-product',{admin:false,products,user,cartCount});
  })
});



router.get('/view-profile',verifyLogin,async(req,res)=>{
  let userData=await userHelpers.getUser(req.session.user._id).then((user)=>{
    console.log("userdata prof:",user)
    res.render('user/profile',{admin:false,userData})

  })
});

router.get('/login',(req,res)=>{ 
  if(req.session.user)
    res.redirect('/')
  else{
    res.render('user/login',{"loginErr":req.session.userLoginErr});
    req.session.userLoginErr=false
  }
});

router.get('/userreg',(req,res)=>{
  res.render('user/registration');
}) 
  
router.post('/userreg',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
    console.log("use",response);
    req.session.user=response
    req.session.user.loggedIn=true

    res.redirect('/')
  })
})

router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.user=response.user
      req.session.user.loggedIn=true
      console.log("user details:",req.session.user)

      res.redirect('/');
    }else{
      req.session.userLoginErr="Invalid email or password"
      res.redirect('/login')
    }
  })
}); 

router.get('/logout',(req,res)=>{
  // req.session.destroy()
  req.session.user=null 
  req.session.userLoggedIn=false
  res.redirect('/') 
})

router.get('/cart',async(req,res)=>{
  
  console.log("hai")
  ///HAVE TO DO CART STATUS WHEN CART IS EMPTY AT THE BEGINNING
  let user=req.session.user._id
  let products=await userHelpers.getCartProducts(user)
  console.log(products);
  // if(totalValue===null || products===null){
  //   res.redirect('/') 
  // } 
  let totalValue=0;

  if(products.length>0){
    totalValue=await userHelpers.getTotalAmount(user)
    res.render('user/cart',{products,user:req.session.user._id,totalValue})

  }
})

router.get('/add-to-cart/:id',(req,res)=>{
  console.log("call api");
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true })
    // res.redirect('/')

  })  
})

router.post('/change-product-quantity',(req,res,next)=>{
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total=await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})   

router.post('/remove-product',(req,res,next)=>{
  // let cartId=req.params._id
  userHelpers.removingProduct(req.body).then((response)=>{
    res.json(response) 
  })
}) 

router.get('/place-order',async(req,res)=>{
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
});

router.post('/place-order',async(req,res)=>{  
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId=>{
    console.log(orderId)
    if (req.body['payMethod']==='COD'){
      res.json({codSuccess:true})
      // res.redirect('/order-success')
    }else{
     userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
      console.log('hello');
        res.json(response)
})
    }
    // res.json({status:true})
  }))
  console.log(req.body)
  // res.render('user/place-order',{user:req.session.user})
});

router.get('/order-success',((req,res)=>{
  res.render('user/order-success',{user:req.session.user})
}))

router.get('/orders',(async(req,res)=>{
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})
}))

router.get('/view-order-products/:id',(async(resolve,reject)=>{
  let products=await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-orders',{user:req.session.user,products})
})) 

router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then((response)=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("Payment Success");
    res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:''})  
  })
})
 
module.exports = router;