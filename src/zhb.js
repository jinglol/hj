(function () { function r(e, n, t) { function o(i, f) { if (!n[i]) { if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a } var p = n[i] = { exports: {} }; e[i][0].call(p.exports, function (r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t) } return n[i].exports } for (var u = "function" == typeof require && require, i = 0; i < t.length; i++)o(t[i]); return o } return r })()({
	1: [function (require, module, exports) {
		/* FileSaver.js
		 * A saveAs() FileSaver implementation.
		 * 1.3.2
		 * 2016-06-16 18:25:19
		 *
		 * By Eli Grey, http://eligrey.com
		 * License: MIT
		 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
		 */

		/*global self */
		/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

		/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

		var saveAs = saveAs || (function (view) {
			"use strict";
			// IE <10 is explicitly unsupported
			if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
				return;
			}
			var
				doc = view.document
				// only get URL when necessary in case Blob.js hasn't overridden it yet
				, get_URL = function () {
					return view.URL || view.webkitURL || view;
				}
				, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
				, can_use_save_link = "download" in save_link
				, click = function (node) {
					var event = new MouseEvent("click");
					node.dispatchEvent(event);
				}
				, is_safari = /constructor/i.test(view.HTMLElement) || view.safari
				, is_chrome_ios = /CriOS\/[\d]+/.test(navigator.userAgent)
				, throw_outside = function (ex) {
					(view.setImmediate || view.setTimeout)(function () {
						throw ex;
					}, 0);
				}
				, force_saveable_type = "application/octet-stream"
				// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
				, arbitrary_revoke_timeout = 1000 * 40 // in ms
				, revoke = function (file) {
					var revoker = function () {
						if (typeof file === "string") { // file is an object URL
							get_URL().revokeObjectURL(file);
						} else { // file is a File
							file.remove();
						}
					};
					setTimeout(revoker, arbitrary_revoke_timeout);
				}
				, dispatch = function (filesaver, event_types, event) {
					event_types = [].concat(event_types);
					var i = event_types.length;
					while (i--) {
						var listener = filesaver["on" + event_types[i]];
						if (typeof listener === "function") {
							try {
								listener.call(filesaver, event || filesaver);
							} catch (ex) {
								throw_outside(ex);
							}
						}
					}
				}
				, auto_bom = function (blob) {
					// prepend BOM for UTF-8 XML and text/* types (including HTML)
					// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
					if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
						return new Blob([String.fromCharCode(0xFEFF), blob], { type: blob.type });
					}
					return blob;
				}
				, FileSaver = function (blob, name, no_auto_bom) {
					if (!no_auto_bom) {
						blob = auto_bom(blob);
					}
					// First try a.download, then web filesystem, then object URLs
					var
						filesaver = this
						, type = blob.type
						, force = type === force_saveable_type
						, object_url
						, dispatch_all = function () {
							dispatch(filesaver, "writestart progress write writeend".split(" "));
						}
						// on any filesys errors revert to saving with object URLs
						, fs_error = function () {
							if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
								// Safari doesn't allow downloading of blob urls
								var reader = new FileReader();
								reader.onloadend = function () {
									var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
									var popup = view.open(url, '_blank');
									if (!popup) view.location.href = url;
									url = undefined; // release reference before dispatching
									filesaver.readyState = filesaver.DONE;
									dispatch_all();
								};
								reader.readAsDataURL(blob);
								filesaver.readyState = filesaver.INIT;
								return;
							}
							// don't create more object URLs than needed
							if (!object_url) {
								object_url = get_URL().createObjectURL(blob);
							}
							if (force) {
								view.location.href = object_url;
							} else {
								var opened = view.open(object_url, "_blank");
								if (!opened) {
									// Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
									view.location.href = object_url;
								}
							}
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
							revoke(object_url);
						}
						;
					filesaver.readyState = filesaver.INIT;

					if (can_use_save_link) {
						object_url = get_URL().createObjectURL(blob);
						setTimeout(function () {
							save_link.href = object_url;
							save_link.download = name;
							click(save_link);
							dispatch_all();
							revoke(object_url);
							filesaver.readyState = filesaver.DONE;
						});
						return;
					}

					fs_error();
				}
				, FS_proto = FileSaver.prototype
				, saveAs = function (blob, name, no_auto_bom) {
					return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
				}
				;
			// IE 10+ (native saveAs)
			if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
				return function (blob, name, no_auto_bom) {
					name = name || blob.name || "download";

					if (!no_auto_bom) {
						blob = auto_bom(blob);
					}
					return navigator.msSaveOrOpenBlob(blob, name);
				};
			}

			FS_proto.abort = function () { };
			FS_proto.readyState = FS_proto.INIT = 0;
			FS_proto.WRITING = 1;
			FS_proto.DONE = 2;

			FS_proto.error =
				FS_proto.onwritestart =
				FS_proto.onprogress =
				FS_proto.onwrite =
				FS_proto.onabort =
				FS_proto.onerror =
				FS_proto.onwriteend =
				null;

			return saveAs;
		}(
			typeof self !== "undefined" && self
			|| typeof window !== "undefined" && window
			|| this.content
		));
		// `self` is undefined in Firefox for Android content script context
		// while `this` is nsIContentFrameMessageManager
		// with an attribute `content` that corresponds to the window

		if (typeof module !== "undefined" && module.exports) {
			module.exports.saveAs = saveAs;
		} else if ((typeof define !== "undefined" && define !== null) && (define.amd !== null)) {
			define("FileSaver.js", function () {
				return saveAs;
			});
		}

	}, {}], 2: [function (require, module, exports) {
		var start_id = 1;
		var progress;
		var initstr;
		var totalWidth = 600;
		var user_answer;
		var totle_start_time;
		var totle_end_time;
		var start_time;
		var end_time;
		var user_time;
		var final_result = "";
		var right="";
		var totle_panel=0;
		//开始答题
		$("#start").click(function () {
			totle_start_time=new Date();
			init(start_id);
		});



		$("#submit").click(function () {
			totle_end_time=new Date();
			var totle_time=(totle_end_time-totle_start_time)/1000;
			var FileSaver = require('file-saver');
			final_result+="总时间："+totle_time+"秒";
			var blob = new Blob([final_result], { type: "text/plain;charset=utf-8" });
			if($("#survey").val()=="matrix"){
				FileSaver.saveAs(blob, "matrix.txt");
			}
			if($("#survey").val()=="nodelink"){
				FileSaver.saveAs(blob, "nodelink.txt");
			}
			if($("#survey").val()=="react"){
				FileSaver.saveAs(blob, "react.txt");
			}
			if($("#survey").val()=="storyline"){
				FileSaver.saveAs(blob, "storyline.txt");
			}
			if($("#survey").val()=="video"){
				FileSaver.saveAs(blob, "video.txt");
			}
		
			
			console.log(final_result);
			$("#panel" + totle_panel).css("display", "none");
			location.reload();

		});
		//显示第i个面板
		function init(id) {
			$("#panel" + id).css("display", "block");
			// $('#progress_div').css("display", "block");
			//显示面板即开始计时
			start_time = new Date();
			progress = 1;
			// initstr = '';
			// initstr = setInterval(function (id) {
			// 	$('#' + id).css({
			// 		width: progress
			// 	})
			// 	if (progress == totalWidth) {
			// 		clearInterval(initstr);
			// 	}
			// 	progress = progress + 1;

			// }, 100);
		}

		function loadInfo() {
			var jsonData_circle;
			try {
				jsonData_circle = JSON.parse(document.getElementById("jsonInputField").value);
			} catch (e) {}
			jsonData_circle.children.forEach(classs=>{
				classs.children.forEach(question=>{
					totle_panel=totle_panel+1;
				});
				console.log(totle_panel);
			});
			
				$("#panel_group").html("");//清空info内容
				console.log(jsonData_circle);
				jsonData_circle.children.forEach(classs => {
					var class_name = classs.class;
					classs.children.forEach(question => {
						var item = question.item;
						var id = question.id;
						var question_content = question.question;
						var answer = question.answer;
						var options = question.options;
						$("#panel_group").append(
							"<div id ='panel" + id + "'" + "class='panel panel-primary' style='display:none'>"
							+ "<div class='panel-heading'>"
							+ "<h3 class='panel-title'>" + class_name + item + "</h3>"
							+ "</div>"
							+ "<div class='panel-body'>"
							+ "<div id='question'>"
							+ "<span>Question：</span>" + question_content + "</div>"
							+ "<div id='answer" + id + "'" + "style='display:block'>"
							+ "<span>Options：</span>"
							+ "<div class='btn-group' data-toggle='buttons'>"
							+ "<label class='btn btn-default '>"
							+ "<input type='radio' name='options' value=" + options[0] + "> " + options[0]
							+ "</label>"
							+ "<label class='btn btn-default '>"
							+ "<input type='radio' name='options' value=" + options[1] + ">" + options[1]
							+ "</label>"
							+ "<label class='btn btn-default '>"
							+ "<input type='radio' name='options' value=" + options[2] + ">" + options[2]
							+ "</label>"
							+ "<label class='btn btn-default '>"
							+ "<input type='radio' name='options' value=" + options[3] + ">" + options[3]
							+ "</label>"
							+ "<label class='btn btn-default '>"
							+ "<input type='radio' name='options' value=" + options[4] + ">" + options[4]
							+ "</label>"
							+ "</div>"
							+ "</div>"
							+ "</div>"
							+ "<div class='panel-footer'>"
							+ "<button id='start_answer" + id + "'" + "type='button' class='btn btn-success'>Submit</button>"
							+"<input id=item_answer"+id+" value='"+answer +"' style='display:none'>"
							+ " </div>"
						);
						$("#start_answer" + id).click(function () {
							end_time = new Date();
							user_time = (end_time - start_time) / 1000;
							//判断是否超时
							if (user_time > 60) {
								user_time = user_time + "超时";
							}

								user_answer = $("#panel" + id + " input:radio:checked").val();
								item_answer=$("#item_answer"+id).val();
								if(user_answer==item_answer){
									right="正确";
								}
								else{
									right="错误";
								}
								console.log(user_answer);
								final_result += "第" + id + "题" + "," + "用户选项" + user_answer + ","+"("+right+")"+"所用时间" + user_time + "秒" + "\r\n";
								start_id = start_id + 1;
								// $('#progress_div').css("display", "none");
								if (start_id > totle_panel) {
									
									alert("答题完毕！请按提交按钮！");
									start_id = 1;
									
									
								} else {
									//该题答完之后重置按钮文字，方便下个用户继续答题
									 $("#panel" + id).css("display", "none");
									// $("#start_answer" + id).val("开始选择");
									// $("#start_answer" + id).html("开始选择");
									init(start_id);
								}





						});

					});
				});


		}
		loadInfo();

	}, { "file-saver": 1 }]
}, {}, [2]);
