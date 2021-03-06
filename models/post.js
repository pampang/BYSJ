var mongodb = require('./db');

function Post(type, name, head, title, tags, post, count, startTime, endTime, province, city, district, detail) {
	this.type = type || 0;
	this.name = name || '';
	this.head = head || '';
	this.title = title || '';
	this.tags = tags || '';
	this.post = post || '';
	this.count = count || '';
	this.startTime = startTime || '';
	this.endTime = endTime || '';
	this.province = province || '';
	this.city = city || '';
	this.district = district || '';
	this.detail = detail || '';
}

Post.prototype.save = function(callback) {
	var date = new Date();

	// 存储各种事件格式，方面以后扩展
	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + '-' + (date.getMonth() + 1),
		day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
		minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	};

	// 要存入数据库的文档
	var post = {
		type: this.type,
		name: this.name,
		head: this.head,
		time: time,
		title: this.title,
		tags: this.tags,
		post: this.post,
		count: this.count,
		startTime: this.startTime,
		endTime: this.endTime,
		province: this.province,
		city: this.city,
		district: this.district,
		detail: this.detail,
		comments: [],
		pv: 1
	};

	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// 读取posts集合
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// 将文档插入posts集合
			collection.insert(post, {
				safe: true
			}, function(err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null); // 返回err为null，也就是正常时候的方法。
			});
		});
	});
};

// 读取所有文章及其相关信息
Post.getAll = function(name, callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// 读取posts集合
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			var query = {};
			if (name) {
				query.name = name;
			}
			// 根据query对象查询文章
			collection.find(query).sort({
				time: -1
			}).toArray(function(err, docs) {
				mongodb.close();
				if (err) {
					return callback(err); //失败！返回err
				}
				callback(null, docs); // 成功！以数组形式返回查询的结果
			});
		});
	});
};

// 获取十篇文章
Post.getTen = function(name, page, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			callback(err);
		}
		// 读取posts集合
		db.collection('posts', function(err, collection) {
			if (err) {
				callback(err);
			}
			var query = {};
			if (name) {
				query.name = name;
			}
			// 使用Count返回特定查询的文档数total
			collection.count(query, function(err, total) {
				// 根据query对象查询，并跳过前(page-1)*10个结果，返回之后的10个结果
				collection.find(query, {
					// 不建议使用skip和limit，更应上网查询更好的方法
					skip: (page - 1) * 10,
					limit: 10
				}).sort({
					time: -1
				}).toArray(function(err, docs) {
					mongodb.close();
					if (err) {
						callback(err);
					}
					callback(null, docs, total);
				});
			});
		});
	});
}

// 获取一篇文章
Post.getOne = function(name, day, title, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// 读取posts集合
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// 根据用户名、发表日期及文章名进行查询
			collection.findOne({
				'name': name,
				'time.day': day,
				'title': title
			}, function(err, doc) {
				if (err) {
					mongodb.close();
					return callback(err);
				}
				if (doc) {
					// 每访问1次，pv值增加1
					collection.update({
						'name': name,
						'time.day': day,
						'title': title
					}, {
						$inc: {
							'pv': 1
						}
					}, function(err) {
						mongodb.close();
						if (err) {
							callback(err);
						}
					});
				}
				callback(null, doc);
			});
		});
	});
};

// 获取一篇文章
Post.getOne2 = function(name, day, title, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// 读取posts集合
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// 根据用户名、发表日期及文章名进行查询
			collection.findOne({
				'name': name,
				'time.day': day,
				'title': title
			}, function(err, doc) {
				if (err) {
					mongodb.close();
					return callback(err);
				}
				callback(null, doc);
			});
		});
	});
};

// 返回所有文章存档信息
Post.getArchive = function(callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			callback(err);
		}
		// 读取Posts集合
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				callback(err);
			}
			// 返回包含name, time, title属性的文档组成的存档数组
			collection.find({}, {
				"name": 1,
				"time": 1,
				"title": 1,
				"type": 1,
				"isDisabled": 1
			}).sort({
				time: -1
			}).toArray(function(err, docs) {
				mongodb.close();
				if (err) {
					callback(err);
				}
				callback(null, docs);
			});
		});
	});
}

// 返回所有标签
Post.getTags = function(callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// 读取Posts集合
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// distinct用来找出给定键的所有不同值
			collection.distinct('tags', function(err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
}

// 返回含有特定标签的所有文章
Post.getTag = function(tag, callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// 查询所有tags数组内包含tag的文档
			// 并返回只含有name,time,title组成的数组
			collection.find({
				'tags': tag
			}, {
				'name': 1,
				'time': 1,
				'title': 1,
				'type': 1
			}).sort({
				time: -1
			}).toArray(function(err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
}

// 返回原始发表的内容(markdown格式)
Post.edit = function(name, day, title, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// 读取posts集合
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// 根据用户名、发表日期及文章名进行查询
			collection.findOne({
				'name': name,
				'time.day': day,
				'title': title
			}, function(err, doc) {
				if (err) {
					mongodb.close();
					return callback(err);
				}
				callback(null, doc);
			});
		});
	});
};

Post.update = function(name, day, title, tags, post, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				return callback(err);
			}
			// 更新文章内容
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$set: {
					post: post,
					tags: tags
				}
			}, function(err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
}

Post.updateActivity = function(name, day, title, tags, post, startTime, endTime, province, city, district, detail, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				return callback(err);
			}
			// 更新文章内容
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$set: {
					post: post,
					tags: tags,
					startTime: startTime,
					endTime: endTime,
					province: province,
					city: city,
					district: district,
					detail: detail
				}
			}, function(err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
}

Post.updateAble = function(name, day, title, isDisabled, reason, callback) {
	// 打开数据库
	debugger;
	console.log(isDisabled, reason);
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				return callback(err);
			}
			// 更新文章内容
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$set: {
					isDisabled: isDisabled,
					reason: reason
				}
			}, function(err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
}

Post.remove = function(name, day, title, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		};
		db.collection('posts', function(err, collection) {
			if (err) {
				return callback(err);
			}
			// 根据用户名、日期和标题查找并删除一篇文章
			collection.remove({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				w: 1
			}, function(err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
}

Post.search = function(keyword, callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			var pattern = new RegExp(keyword, 'i');
			collection.find({
				'title': pattern
			}, {
				'name': 1,
				'time': 1,
				'title': 1
			}).sort({
				time: -1
			}).toArray(function(err, docs) {
				console.log(2);
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

Post.joinActivity = function(name, day, title, userName, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				return callback(err);
			}
			// 更新文章内容
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$push: {
					"joinList": userName
				}
			}, function(err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
}

Post.deleteComment = function(name, day, title, commentContent, commentTime, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// 读取posts集合
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// 根据用户名、发表日期及文章名进行查询
			collection.findOne({
				'name': name,
				'time.day': day,
				'title': title
			}, function(err, doc) {
				console.log(doc.comments[1]);
				if (err) {
					mongodb.close();
					return callback(err);
				}
				for (var i = 0, len = doc.comments.length; i < len; i++) {
					// 根据name, content, time指定评论
					if (doc.comments[i].content == commentContent && doc.comments[i].time == commentTime) {

						doc.comments.splice(i + 1, 1);
						// 删除评论
						collection.update({
							"name": name,
							"time.day": day,
							"title": title
						}, {
							$set: {
								'comments': doc.comments
							}
						}, function(err) {
							mongodb.close();
							if (err) {
								return callback(err);
							}
							return callback(null);
						});
					}
				}
			});
		});
	});
};

module.exports = Post;