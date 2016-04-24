var express = require('express');
var router = express.Router();

var crypto = require('crypto'),
	User = require('../models/user.js'),
	// Admin = require('../models/admin.js'),
	Post = require('../models/post.js'),
	Msg = require('../models/Msg.js'),
	Comment = require('../models/comment.js');

module.exports = function(app){
	/* GET home page. */
	app.get('/', function(req, res) {
		// 判断是否是第一页，并把请求的页数转换成Number类型
		var page = req.query.p ? parseInt(req.query.p) : 1;
		// 查询并返回第page页的10篇文章
		Post.getTen(null, page, function(err, posts, total) {
			if (err) {
				posts = [];
			}
			res.render('index', {
				title: '主页',
				user: req.session.user,
				admin: req.session.admin || '',
				posts: posts,
				page: page,
				isFirstPage: (page - 1) == 0,
				isLastPage: ((page - 1) * 10 + posts.length) == total,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});	

	// setting /reg
	app.get('/reg', checkNotLogin);
	app.get('/reg', function(req, res) {
		res.render('reg', { 
			title: '注册',
			user: req.session.user,
			admin: req.session.admin || '',
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/reg', checkNotLogin);
	app.post('/reg', function (req, res) {
		var name = req.body.name,
		    password = req.body.password,
		    password_re = req.body['password-repeat'];
		//检验用户两次输入的密码是否一致
		if (password_re != password) {
		  req.flash('error', '两次输入的密码不一致!'); 
		  return res.redirect('/reg');//返回主册页
		}
		//生成密码的 md5 值
		var md5 = crypto.createHash('md5'),
		    password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
		    name: req.body.name,
		    password: password,
		    email: req.body.email
		});
		//检查用户名是否已经存在 
		User.get(newUser.name, function (err, user) {
		  if (user) {
		    req.flash('error', '用户已存在!');
		    return res.redirect('/reg');//返回注册页
		  }
		  //如果不存在则新增用户
		  newUser.save(function (err, user) {
		    if (err) {
		      req.flash('error', err);
		      return res.redirect('/reg');//注册失败返回主册页
		    }
		    req.session.user = user;//用户信息存入 session
		    req.flash('success', '注册成功!');
		    res.redirect('/');//注册成功后返回主页
		  });
		});
	});

	// setting /login
	app.get('/login', checkNotLogin);
	app.get('/login', function(req, res) {
		res.render('login', { 
			title: '登录', 
			user: req.session.user,
			admin: req.session.admin || '',
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/login', checkNotLogin);
	app.post('/login', function(req, res) {
		// 生成密码的md5值
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		// 检查用户是否存在
		User.get(req.body.name, function(err, user){
			if(!user){
				req.flash('err', '用户不存在！');
				console.log('用户不存在！');
				return res.redirect('/login');			
			};
			// 检查user是否被禁用
			if (user.isDisabled) {
				req.flash('err', '用户被禁用！'+user.reason);
				console.log('用户被禁用！');
				return res.end('用户被禁用'+user.reason);
			}
			// 检查密码是否一致
			if(user.password != password){
				req.flash('error', '密码错误');
				console.log('密码错误');
				return res.redirect('/login');
			};
			// 用户名密码都匹配后，将用户信息存入session
			req.session.user = user;
			console.log('登录成功！');
			return res.redirect('/');
		});
	});

	app.get('/profile', checkLogin);
	app.get('/profile', function (req, res) {
		res.render('profile', {
			title: '个人资料',
			user: req.session.user,
			admin: req.session.admin || '',
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		})
	});

	app.post('/profile', checkLogin);
	app.post('/profile', function (req, res) {

		var currentUser = req.session.user,
			nickname = req.body.nickname,
			sex = req.body.sex,
			age = req.body.age,
			phone = req.body.phone,
			province = req.body.province,
			city = req.body.city,
			district = req.body.district;
		console.log(currentUser.name);
		User.update(currentUser.name, nickname, sex, age, phone, province, city, district, function(err, user){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			req.session.user = user;
			req.flash('success', '修改成功!');
			console.log('修改成功!');
			res.redirect('/profile'); //成功！返回文章页
		});
	})

	app.get('/pwd', checkLogin);
	app.get('/pwd', function (req, res) {
		res.render('pwd', {
			title: '修改密码',
			user: req.session.user,
			admin: req.session.admin || '',
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		})
	})

	app.post('/pwd', checkLogin);
	app.post('/pwd', function (req, res) {

		var currentUser = req.session.user,
		    password = req.body.password,
		    password_old = req.body['password_old'],
		    password_re = req.body['password-repeat'];
		//检验用户两次输入的密码是否一致
		if (password_re != password) {
		  req.flash('error', '两次输入的密码不一致!'); 
		  return res.redirect('/pwd');//返回主册页
		}

		//生成密码的 md5 值
		var md5 = crypto.createHash('md5'),
		    password = md5.update(password).digest('hex');

		var md5 = crypto.createHash('md5'),
		    password_old = md5.update(password_old).digest('hex');
		
	    User.get(currentUser.name, function(err, user){
	    	if(!user){
	    		req.flash('error', '用户不存在！');
	    		console.log('用户不存在！');
	    		return res.redirect('/');
	    	}
	    	if(user.password != password_old) {
	    		req.flash('error', '旧密码错误！');
	    		return res.redirect('/pwd');
	    	}
	    });

		User.updatePwd(currentUser.name, password, function(err){
			if(err){
				req.flash('error', '修改密码失败！');
				return res.redirect('/');
			}
			req.flash('success', '修改成功!');
			console.log('修改成功!');
			res.redirect('/'); //成功！返回主页
		});
	})

	// setting /post
	app.get('/post', checkLogin);
	app.get('/post', function(req, res) {
		res.render('post', { 
			title: '发表文章',
			user: req.session.user,
			admin: req.session.admin || '',
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/post', checkLogin);
	app.post('/post', function(req, res) {
		var type = 0,
			currentUser = req.session.user,
			tags = [req.body.tag1, req.body.tag2, req.body.tag3],
			post = new Post(type, currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
		post.save(function(err){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success', '发布成功！');
			console.log('发布成功！');
			res.redirect('/');
		});
	});

	// setting /activity
	app.get('/activity', checkLogin);
	app.get('/activity', function(req, res) {
		res.render('activity', { 
			title: '发布活动',
			user: req.session.user,
			admin: req.session.admin || '',
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/activity', checkLogin);
	app.post('/activity', function(req, res) {
		var currentUser = req.session.user,
			type = 1,
			// startTime = req.body.startTime,
			// endTime = req.body.endTime,
			// count = req.body.count,
			tags = [req.body.tag1, req.body.tag2, req.body.tag3],
			post = new Post(type, currentUser.name, currentUser.head, req.body.title, tags, req.body.post, req.body.count, req.body.startTime, req.body.endTime, req.body.province, req.body.city, req.body.district, req.body.detail);
		post.save(function(err){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success', '发布成功！');
			console.log('发布成功！');
			res.redirect('/');
		});
	});


	// setting /logout
	app.get('/logout', checkLogin);
	app.get('/logout', function(req, res) {
		req.session.user = null;
		req.flash('success', '登出成功！');
		console.log('登出成功！');
		return res.redirect('/');
	});

	// 实现上传！用这种方法，而不用在app.js中引入0.1.6版本的multer来实现那个傻B功能。 
	// var multer = require('multer');
	// var mwMulter1 = multer({ 
	// 	dest: './public/images',
	// 	limits: {
	// 	    fileSize: 100000000
	// 	}
	// });
	// 
	// 上传的图片存放到dest中，但是我们需要用 'images' + req.file.filename 来引用图片。
	// 
	// app.post('/upload', checkLogin);
	// app.post('/upload', mwMulter1.single('file1'), function(req, res) {
	// 	console.log(req.file);   //获取文件的信息
	// 	req.flash('success', '文件上传成功!');
	// 	console.log('文件上传成功!');
	// 	return res.redirect('/upload');
	// });

	// 创建一个multer实例，以进行上传图片的操作。
	var multer = require('multer');
	var imgMulter = multer({
		dest: 'public/images',
		limits: {
			fileSize: 100000000
		}
	});
	app.post('/uploadImg', checkLogin);
	app.post('/uploadImg', imgMulter.single('img'), function (req, res) {
		console.log(req.file);
		res.json({filename: req.file.filename});
	});

	// app.get('/upload', checkLogin);
	// app.get('/upload', function(req, res){
	// 	res.render('upload', {
	// 		title: '文件上传',
	// 		user: req.session.user,
	// 		success: req.flash('success').toString(),
	// 		error: req.flash('error').toString()
	// 	});
	// });

	// app.post('/upload', checkLogin);
	// app.post('/upload', function(req, res) {
	// 	req.flash('success', '文件上传成功!');
	// 	console.log('文件上传成功!');
	// 	return res.redirect('/upload');
	// });

	app.get('/links', function (req, res) {
		res.render('links', {
			title: '友情链接',
			user: req.session.user,
			admin: req.session.admin || '',
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.get('/search', function(req, res) {
		Post.search(req.query.keyword, function(err, posts) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('search', {
			title: 'SEARCH: ' + req.query.keyword,
			posts: posts,
			user: req.session.user,
			admin: req.session.admin || '',
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
		});
	});

	app.get('/u/:name', function(req, res){
		var page = req.query.p ? parseInt(req.query.p) : 1;
		// 检查用户名是否存在
		User.get(req.params.name, function(err, user){
			if(!user){
				req.flash('error', '用户不存在！');
				console.log('用户不存在！');
				return res.redirect('/');
			}
			// 查询并返回用户第page页的10篇文章
			Post.getTen(user.name, page, function(err, posts, total){
				if(err){
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('user', {
					title: user.name,
					posts: posts,
					user: req.session.user,
					admin: req.session.admin || '',
					page: page,
					isFirstPage: (page - 1) == 0,
					isLastPage: ((page - 1) * 10 + posts.length) == total,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});
	
	app.get('/archive', function(req, res) {
		Post.getArchive(function(err, posts) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('archive', {
				title: '存档',
				posts: posts,
				user: req.session.user,
				admin: req.session.admin || '',
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/tags', function(req, res) {
		Post.getTags(function(err, posts) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('tags', {
				title: '标签',
				posts: posts,
				user: req.session.user,
				admin: req.session.admin || '',
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/tags/:tag', function(req, res) {
		Post.getTag(req.params.tag, function(err, posts) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			console.log(posts);
			res.render('tag', {
				title: 'TAG: ' + req.params.tag,
				posts: posts,
				user: req.session.user,
				admin: req.session.admin || '',
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/u/:name/:day/:title', function(req, res){
		// 查询并返回用户的指定文章
		Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			if( post.type == 0 ) {
				res.render('article_post', {
					title: req.params.title,
					post: post,
					user: req.session.user,
					admin: req.session.admin || '',
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
				return;
			};
			if( post.type == 1 ) {
				res.render('article_activity', {
					title: req.params.title,
					post: post,
					user: req.session.user,
					admin: req.session.admin || '',
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
				return;
			}
		});
	});

	app.post('/u/:name/:day/:title', function(req, res) {
		var date = new Date(),
			time = date.getFullYear() + '-' 
					+ (date.getMonth()+1) + '-' 
					+ date.getDate() + ' ' 
					+ date.getHours() + ':' 
					+ (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
		var md5 = crypto.createHash('md5'),
			email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
			head = 'http://www.gravatar.com/avatar/' + email_MD5 + '?s=48';
		var comment = {
			name: req.body.name,
			head: head,
			email: req.body.email,
			website: req.body.website,
			time: time,
			content: req.body.content
		};
		var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
		newComment.save(function(err) {
			if (err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success', '留言成功！');
			console.log('留言成功！');
			res.redirect('back');
		});
	});

	app.put('/u/:name/:day/:title', checkLogin);
	app.put('/u/:name/:day/:title', function (req, res) {
		var currentUser = req.session.user;
		var name = req.params.name;
		Post.joinActivity(req.params.name, req.params.day, req.params.title, currentUser.name, function (err) {
			if (err) {
				req.flash('error', err);
				return res.redirect('back');
			}
		})
		res.json({success: 1});
	})

	app.get('/edit/:name/:day/:title', checkLogin);
	app.get('/edit/:name/:day/:title', function(req, res){
		var currentUser = req.session.user; // 当前用户
		// 用户只能对自己的文章进行修改，所以是currentUser.name, 而不是req.params.name。
		// 当前用户打开其他用户的文章时会报错
		// 以下是报错提示
		// if(req.params.name != currentUser.name){
		// 	res.render('error', {
		// 		message: '无权修改其他用户的文章',
		// 		error: {
		// 			status: null,
		// 			stack: null
		// 		}
		// 	})
		// };
		// 以下是正确渲染
		Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post) {
			if (err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			if( post.type == 0 ) {
				res.render('edit_post', {
					title: '编辑',
					post: post,
					user: req.session.user,
					admin: req.session.admin || '',
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
				return;
			}
			if( post.type == 1 ) {
				res.render('edit_activity', {
					title: '编辑',
					post: post,
					user: req.session.user,
					admin: req.session.admin || '',
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			}
		});
	});

	app.post('/edit/:name/:day/:title', checkLogin);
	app.post('/edit/:name/:day/:title', function(req, res) {
		var currentUser = req.session.user,
			tags = [req.body.tag1, req.body.tag2, req.body.tag3];
		if( req.body.type == 0 ) {
			Post.update(currentUser.name, req.params.day, req.params.title, tags, req.body.post, function(err) {
				var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
				if (err) {
					req.flash('error', err);
					return res.redirect(url); //出错则跳转回文章页
				}
				req.flash('success', '修改成功!');
				console.log('修改成功!');
				res.redirect(url); //成功！返回文章页
			});
			return;
		}
		if( req.body.type == 1 ) {
			Post.updateActivity(currentUser.name, req.params.day, req.params.title, tags, req.body.post, req.body.startTime, req.body.endTime, req.body.province, req.body.city, req.body.district, req.body.detail, function(err) {
				var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
				if (err) {
					req.flash('error', err);
					return res.redirect(url); //出错则跳转回文章页
				}
				req.flash('success', '修改成功!');
				console.log('修改成功!');
				res.redirect(url); //成功！返回文章页
			});
			return;
		}
	});

	app.get('/remove/:name/:day/:title', checkLogin);
	app.get('/remove/:name/:day/:title', function(req, res) {
		var currentUser = req.session.user;
		Post.remove(currentUser.name, req.params.day, req.params.title, function(err) {
			if (err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success', '删除成功!');
			console.log('删除成功!');
			res.redirect('/');
		});
	});

	app.get('/msg', checkLogin);
	app.get('/msg', function (req, res) {

		// 判断是否是第一页，并把请求的页数转换成Number类型
		var page = req.query.p ? parseInt(req.query.p) : 1;
		// 查询并返回第page页的10篇文章
		Msg.getTen(req.session.user.name, page, function(err, msgs, total) {
			if (err) {
				msgs = [];
			}
			res.render('msg', {
				title: '我的消息',
				user: req.session.user,
				admin: req.session.admin || '',
				msgs: msgs,
				page: page,
				isFirstPage: (page - 1) == 0,
				isLastPage: ((page - 1) * 10 + msgs.length) == total,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	})

	app.post('/msg', checkLogin);
	app.post('/msg', function (req, res) {
		var date = new Date(),
			sendFrom = req.body.sendFrom,
			sendTo = req.body.sendTo,
			content = req.body.msgContent,
			time = {
				date: date,
				year: date.getFullYear(),
				month: date.getFullYear() + '-' + (date.getMonth() + 1),
				day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
				minute: date.getFullYear() 
						+ '-' + (date.getMonth() + 1) 
						+ '-' + date.getDate()
						+ ' ' + date.getHours() 
						+ ':' + ( date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
			};
			msg = new Msg(sendFrom, sendTo, time, content);

		msg.save(function(err){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success', '发送消息成功！');
			console.log('发送消息成功！');
			res.redirect('/msg');
		});
	})

	app.delete('/msg', checkLogin);
	app.delete('/msg', function (req, res) {
		console.log('delete start');
		var sendFrom = req.body.sendFrom,
			minute = req.body.minute;
		Msg.remove(sendFrom, minute, function (err) {
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.json({isDelete: true});
		})
	})

	// ================================================
	// 管理员部分
	// ================================================

	// setting /adminLogin
	// 管理员应该直接加在User里面，添加一个属性isAdmin来告诉我们这是管理员。
	app.get('/adminLogin', function(req, res) {
		res.render('adminLogin', { 
			title: '管理员登录', 
			user: req.session.user,
			admin: req.session.admin || '',
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/adminLogin', function(req, res) {
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		// 检查用户是否存在
		User.get(req.body.name, function(err, user){
			if(!user){
				req.flash('err', '管理员不存在！');
				console.log('管理员不存在！');
				return res.redirect('/adminLogin');			
			};
			if (!user.isAdmin) {
				req.flash('err', '该账号非管理员！');
				console.log('该账号非管理员！');
				return res.redirect('/adminLogin');	
			}
			// 检查密码是否一致
			if(user.password != password){
				req.flash('error', '密码错误');
				console.log('密码错误');
				return res.redirect('/adminLogin');
			};
			// 用户名密码都匹配后，将用户信息存入session
			req.session.admin = user;
			console.log('管理员登录成功！');
			return res.redirect('/admin');
		});
	});

	// 管理员主页
	// 将所有的posts获取出来，然后添加一个禁用和启用的按钮。
	// 直接往文章里面加一个isDisabled属性即可。这个加属性应该要写在对应的models里面。
	// 然后在展示的时候，在展示之前先加一个判断，如果为isDisabeld=true则不允许展示。
	// 评论则根据某一篇文章来，允许点击文章的标题来看。添加一个查看评论的按钮。
	// 评论的话，不禁用，直接删除即可。
	// 点击文章也可以直接进入文章的详情页，查看文章内容。
	// 
	// 还有一个是用户的管理。需要遍历所有的用户。然后也加一个isDisabled的功能。
	app.get('/admin', checkLogin);
	app.get('/admin', function (req, res) {
		Post.getArchive(function(err, posts) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/adminLogin');
			}
			User.getAll(function (err, users) {
				if (err) {
					req.flash('error', err);
					return res.redirect('/adminLogin');
				}
				res.render('admin', {
					title: '管理员主页',
					posts: posts,
					users: users,
					admin: req.session.admin || '',
					user: req.session.user || '',
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			})
		});
	})

	// 禁用文章
	app.post('/adminPost', checkLogin);
	app.post('/adminPost', function (req, res) {
		var name = req.body.name,
			title = req.body.title,
			day = req.body.day,
			isDisabled = req.body.isDisabled,
			reason = req.body.reason;

		Post.updateAble(name, day, title, isDisabled, reason, function (err) {
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success', '启/禁用成功！');
			console.log('启/禁用成功！');
			res.json({"ok": true});
		})
	})

	// 禁用用户
	app.post('/adminUser', checkLogin);
	app.post('/adminUser', function (req, res) {
		var name = req.body.name,
			isDisabled = req.body.isDisabled,
			reason = req.body.reason;

		User.updateAble(name, isDisabled, reason, function (err) {
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success', '启/禁用成功！');
			console.log('启/禁用成功！');
			res.json({"ok": true});
		})
	})

	app.get('/admin/comment/:name/:day/:title', function(req, res){
		// 查询并返回用户的指定文章
		Post.getOne2(req.params.name, req.params.day, req.params.title, function(err, post){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}

			res.render('adminComment', {
				title: '评论管理: ' + req.params.title,
				post: post,
				admin: req.session.admin || '',
				user: req.session.user || '',
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
			return;
		});
	});

	// 删除评论
	app.post('/admin/comment/:name/:day/:title', checkLogin);
	app.post('/admin/comment/:name/:day/:title', function (req, res) {
		var content = req.body.content,
			time = req.body.time,
			isDisabled = req.body.isDisabled,
			reason = req.body.reason;

		Post.deleteComment(req.params.name, req.params.day, req.params.title, content, time, function (err) {
			if(err){
				req.flash('error', err);
				return res.redirect('/admin/comment/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
			}
			req.flash('success', '删除评论成功！');
			console.log('删除评论成功！');
			res.json({"ok": true});
		})
	})
	// ================================================


	app.use(function (req, res) {
		Post.getArchive(function(err, posts) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('404', {
				title: '帅到找不到链接！',
				posts: posts,
				user: req.session.user,
				admin: req.session.admin || '',
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	})

	function checkLogin(req, res, next){
		// if(!req.session.user || !req.session.admin ){
		// 	req.flash('error', '未登录！');
		// 	console.log('未登录！');
		// 	return res.redirect('/login');
		// }
		next();
	}

	function checkNotLogin(req, res, next){
		if(req.session.user){
			req.flash('error', '已登录!');
			console.log('已登录!');
			return res.redirect('back'); //返回到之前的页面
		}
		next();
	}
}