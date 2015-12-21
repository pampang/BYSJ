var express = require('express');
var router = express.Router();

var crypto = require('crypto'),
	User = require('../models/user.js'),
	Post = require('../models/post.js'),
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
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/reg', checkNotLogin);
	app.post('/reg', function(req, res) {
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'];

		// 检验用户两次输入的密码是否一致
		if(password_re != password){
			req.flash('error', '两次输入的密码不一致！');
			console.log('两次输入的密码不一致！');
			return res.redirect('/reg');
		}

		// 生成密码的md5值
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');

		var newUser = new User({
			name: req.body.name,
			password: password,
			email: req.body.email
		});

		// 检查用户名是否已经存在
		User.get(newUser.name, function(err, user){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			if(user){
				req.flash('error', '用户已存在！');
				console.log('用户已存在！');
				return res.redirect('/reg');
			}

			// 如果不存在则新增用户
			newUser.save(function(err, user){
				if(err){
					req.flash('error', err);
					return res.redirect('/reg');
				}
				req.session.user = user; // 用户信息存入session
				req.flash('success', '注册成功！');
				console.log('注册成功！');
				res.redirect('/');  // 注册成功后返回主页
			});
		});
	});

	// setting /login
	app.get('/login', checkNotLogin);
	app.get('/login', function(req, res) {
		res.render('login', { 
			title: '登录', 
			user: req.session.user,
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

	// setting /post
	app.get('/post', checkLogin);
	app.get('/post', function(req, res) {
		res.render('post', { 
			title: '发表',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString(),
		});
	});

	app.post('/post', checkLogin);
	app.post('/post', function(req, res) {
		var currentUser = req.session.user,
			post = new Post(currentUser.name, req.body.title, req.body.post);
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

	app.get('/upload', checkLogin);
	app.get('/upload', function(req, res){
		res.render('upload', {
			title: '文件上传',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
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
					page: page,
					isFirstPage: (page - 1) == 0,
					isLastPage: ((page - 1) * 10 + posts.length) == total,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
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
			console.log('post', post);
			res.render('article', {
				title: req.params.title,
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.post('/u/:name/:day/:title', function(req, res) {
		var date = new Date(),
			time = date.getFullYear() + '-' 
					+ (date.getMonth()+1) + '-' 
					+ date.getDate() + ' ' 
					+ date.getHours() + ':' 
					+ (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
		var comment = {
			name: req.body.name,
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
			res.render('edit', {
				title: '编辑',
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.post('/edit/:name/:day/:title', checkLogin);
	app.post('/edit/:name/:day/:title', function(req, res) {
		var currentUser = req.session.user;
		Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err) {
			var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
			if (err) {
				req.flash('error', err);
				return res.redirect(url); //出错则跳转回文章页
			}
			req.flash('success', '修改成功!');
			console.log('修改成功!');
			res.redirect(url); //成功！返回文章页
		});
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

	function checkLogin(req, res, next){
		if(!req.session.user){
			req.flash('error', '未登录！');
			console.log('未登录！');
			return res.redirect('/login');
		}
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