// JavaScript Document

// Constants
var PAGE_TITLE	= "Jabber - Client";
var SERVER_NAME	= "@gmail.com";
var SERVER_URL	= "http://bosh.metajack.im:5280/xmpp-httpbind";
//----------


$(document).ready(function()
{
	var tabFocus		= true;
	var objChatPanel	= $("#chatPanel");
	var objRightPanel	= $("#rightPanel");
	var objJabberList	= $("#jabberListPanel ul");
	
	$("#btn_login").click(function()
	{
		var user_email		= $("#txt_email").val();
		var user_password	= $("#txt_password").val();
		
		$("#btn_login").val("Loggin in...");
		
		$.xmpp.connect(
		{
			url: SERVER_URL,
			jid: user_email+SERVER_NAME,
			password: user_password,
			onConnect: function()
			{
				$("#btn_login").val("Login");
				$("#loginPanel").hide();
				$("#chatPanel, #rightPanel").show();
				$.xmpp.setPresence(null);
				$("#rightPanel .statusSection #lst_status").val("available");
			},
			onPresence: function(presence)
			{
				var status_icon = "available";
				var cur_id = presence.from.split("@")[0];
				var username = MD5.hexdigest(cur_id);
				
				$("#jabberListPanel ul li").each(function()
				{
					if($(this).data("username") == username)
					{
						$(this).remove()
						return(false);
					}	
				});
				
				switch(presence.show)
				{
					case "dnd":			status_icon = "busy"; break;
					case "away":		status_icon = "away"; break;
					case "unavailable":	status_icon = "unavailable"; break;
					default:			status_icon = "available";
				}
				
				$("#"+username+" .header .title .statusIcon").attr("class", "statusIcon "+status_icon);
				
				objJabberList.append("<li data-username='"+username+"'><span class='statusIcon "+status_icon+"'></span><div class='name'>"+cur_id+"</div>");
				objJabberList.find("li[data-username="+username+"]").click(function()
				{
					var id = MD5.hexdigest(presence.from.split("@")[0]);
					var conversation = $("#"+id);
					if(conversation.length == 0)
					{
						open_chat({to:presence.from,status:status_icon});
					}
				});
			},
			onDisconnect: function()
			{
				objJabberList.empty();
				$("#chatPanel, #rightPanel").hide();
				$("#loginPanel").show();
			},
			onMessage: function(message)
			{
				var status_icon = "available";
				var jid = message.from.split("@")[0];
				var id = MD5.hexdigest(jid);
				var conversation = $("#"+id);
				if(conversation.length == 0)
				{
					open_chat({to:message.from,status:status_icon});
				}
				conversation = $("#"+id);
				if(message.body == null)
				{
					return;
				}
				
				// Show message
				if(conversation.find(".conversation .msgBlock:last").hasClass("receive"))
				{
					message.body = message.body.replace(/\:\)/gi,'Smile');
					var current_message = message.body+"<br />";
					conversation.find(".conversation .msgBlock:last").append(current_message);
				}
				else
				{
					var current_message = "<div class='msgBlock receive'><span class='username'>"+jid +": </span>"+message.body+"<br /></div>";
					conversation.find(".conversation").append(current_message);
				}
				conversation.find(".conversation").prop("scrollTop", conversation.find('.conversation').prop("scrollHeight"));
				//-------------
				
				// Change Title
				if(tabFocus == false)
				{
					$("title").html(jid+" says...");
				}
				//-------------
			},
			onError:function(error)
			{
				$("#btn_login").val("Login");
			}
		});
	});
	
	// Change status
	$("#lst_status").change(function()
	{
		if($(this).val() == "disconnect")
		{
			$.xmpp.disconnect();
		}
		else
		{
			$.xmpp.setPresence($(this).val());
		}
	});
	//--------------
	
	function open_chat(options)
	{
		var boxX;
        var boxY;
        var startX;
        var startY;
        var objBox;
        var moveFlag;
		
		var id = MD5.hexdigest(options.to.split("@")[0]);
		var chat_window = "";
	
		chat_window += "<div id='"+id+"' class='chatBox'>";
		chat_window += "<div class='header'><div class='title'><span class='statusIcon "+options.status+"'></span>"+options.to.split("@")[0]+"</div><div class='toolbar'><span class='btn btnErase' title='Clear chat history'>#</span><span class='btn btnClose' title='End chat'>X</span></div></div>";
		chat_window += "<div class='body'><div class='conversation'></div></div>"
		chat_window += "<div class='curmsg'><input type='text' class='myCurMsg' /></div>";
		chat_window += "</div>";
	
		var objChatWindow	= $(chat_window);
		var objEraseBtn		= objChatWindow.find(".btnErase");
		var objCloseBtn		= objChatWindow.find(".btnClose");
		var objInput		= objChatWindow.find("input");
		var conversation	= objChatWindow.find(".conversation");
		
		// Send message
		objInput.keyup(function(event)
		{
			if(event.keyCode == 13)
			{
				var current_message = replace_simileys(objInput.val());
				$.xmpp.sendMessage({to:options.to, body: objInput.val()});
				
				if(conversation.find(".msgBlock:last").hasClass("sent"))
				{
					current_message = current_message+"<br />";
					conversation.find(".msgBlock:last").append(current_message);
				}
				else
				{
					current_message = "<div class='msgBlock sent'><span class='username'>Me: </span>"+current_message+"<br /></div>";
					conversation.append(current_message);
				}
				conversation.prop("scrollTop", conversation.prop("scrollHeight"));
				objInput.val("");
			}
		});
		//-------------
		
		// Erase chat history
		objEraseBtn.click(function()
		{
			$(this).closest(".chatBox").find(".body .conversation").empty();
		});
		//-------------------
		
		// Close chat box
		objCloseBtn.click(function()
		{
			$(this).closest(".chatBox").remove();
		});
		//---------------

		if($("#chatBox_group").length == 0)
		{
			var chatBox_group = "<div style='height:250px;' id='chatBox_group'></div>"
			$(chatBox_group).css("position", "absolute");
			$(chatBox_group).css("z-index", 1000);
			$(chatBox_group).css("top", $(window).height() - 222);
	
			objChatPanel.append(chatBox_group);
			objChatPanel.find(".curmsg .myCurMsg").focus();
		}

		$("#chatBox_group").append(objChatWindow);
		$(objChatWindow).show();
		objChatWindow.find(".curmsg .myCurMsg").focus();

		
		// Bring to front
		$(".chatBox").click(function()
		{
			$(".chatBox").css("z-index", "90");
			$(this).css("z-index", "99");
			$(this).find(".curmsg .myCurMsg").focus();
			$(window).focus();
		});
		//---------------
		
		// Draggable
		$(".chatBox .header").mousedown(function(e)
        {
			$(".chatBox").css("z-index", "90");
			$(this).closest(".chatBox").css("z-index", "99");
			
            objBox = $(this).closest(".chatBox");
            boxX = objBox.position().left;
            boxY = objBox.position().top;
            startX = e.pageX;
            startY = e.pageY;
            moveFlag = true;
			$(window).focus();
        });
        
        $("body").mousemove(function(e)
        {
            var nowX = e.pageX;
            var nowY = e.pageY;
            if(moveFlag)
            {
                objBox.css({"left":(boxX + (nowX - startX)), "top":(boxY + (nowY - startY))});
            }
        });
        
        $("body").mouseup(function(e)
        {
            moveFlag = false;
        });
		//----------
	}
	
	// Replace simileys on chat message
	function replace_simileys(msg)
	{
		msg = msg.replace(/\:\)/gi, "<span class='simileyIcon s1'></span>");
		msg = msg.replace(/\:-\)/gi, "<span class='simileyIcon s1'></span>");
		msg = msg.replace(/\:\(/gi, "<span class='simileyIcon s2'></span>");
		msg = msg.replace(/\:-\(/gi, "<span class='simileyIcon s2'></span>");
		msg = msg.replace(/\:D/gi, "<span class='simileyIcon s3'></span>");
		msg = msg.replace(/\:-D/gi, "<span class='simileyIcon s3'></span>");
		msg = msg.replace(/8\)/gi, "<span class='simileyIcon s4'></span>");
		msg = msg.replace(/\:o/gi, "<span class='simileyIcon s5'></span>");
		
		msg = msg.replace(/\;\(/gi, "<span class='simileyIcon s6'></span>");
		msg = msg.replace(/\(sweet\)/gi, "<span class='simileyIcon s7'></span>");
		msg = msg.replace(/\:\|/gi, "<span class='simileyIcon s8'></span>");
		msg = msg.replace(/\:\*/gi, "<span class='simileyIcon s9'></span>");
		msg = msg.replace(/\:P/gi, "<span class='simileyIcon s10'></span>");
		
		msg = msg.replace(/\:$/gi, "<span class='simileyIcon s11'></span>");
		msg = msg.replace(/\:\^\(/gi, "<span class='simileyIcon s12'></span>");
		msg = msg.replace(/\|-\)/gi, "<span class='simileyIcon s13'></span>");
		msg = msg.replace(/\|\(/gi, "<span class='simileyIcon s14'></span>");
		msg = msg.replace(/\(inlove\)/gi, "<span class='simileyIcon s15'></span>");
		
		msg = msg.replace(/\;\)/gi, "<span class='simileyIcon s16'></span>");
		msg = msg.replace(/\]\:\)/gi, "<span class='simileyIcon s17'></span>");
		msg = msg.replace(/\(talk\)/gi, "<span class='simileyIcon s18'></span>");
		msg = msg.replace(/\(yawn\)/gi, "<span class='simileyIcon s19'></span>");
		msg = msg.replace(/\(puke\)/gi, "<span class='simileyIcon s20'></span>");
		
		msg = msg.replace(/\(doh\)/gi, "<span class='simileyIcon s21'></span>");
		msg = msg.replace(/\:\@/gi, "<span class='simileyIcon s22'></span>");
		msg = msg.replace(/\(wasntme\)/gi, "<span class='simileyIcon s23'></span>");
		msg = msg.replace(/\(party\)/gi, "<span class='simileyIcon s24'></span>");
		msg = msg.replace(/\:\S/gi, "<span class='simileyIcon s25'></span>");
		
		msg = msg.replace(/\(mm\)/gi, "<span class='simileyIcon s26'></span>");
		msg = msg.replace(/8\-\|/gi, "<span class='simileyIcon s27'></span>");
		msg = msg.replace(/\:X/gi, "<span class='simileyIcon s28'></span>");
		msg = msg.replace(/\(hi\)/gi, "<span class='simileyIcon s29'></span>");
		msg = msg.replace(/\(call\)/gi, "<span class='simileyIcon s30'></span>");
		
		msg = msg.replace(/\(mm\)/gi, "<span class='simileyIcon s31'></span>");
		msg = msg.replace(/8\-\|/gi, "<span class='simileyIcon s32'></span>");
		msg = msg.replace(/\:X/gi, "<span class='simileyIcon s33'></span>");
		msg = msg.replace(/\(hi\)/gi, "<span class='simileyIcon s34'></span>");
		msg = msg.replace(/\(call\)/gi, "<span class='simileyIcon s35'></span>");
		
		msg = msg.replace(/\(devil\)/gi, "<span class='simileyIcon s36'></span>");
		msg = msg.replace(/\(angel\)/gi, "<span class='simileyIcon s37'></span>");
		msg = msg.replace(/\(envy\)/gi, "<span class='simileyIcon s38'></span>");
		msg = msg.replace(/\(wait\)/gi, "<span class='simileyIcon s39'></span>");
		msg = msg.replace(/\(makeup\)/gi, "<span class='simileyIcon s40'></span>");
		
		msg = msg.replace(/\(chuckle\)/gi, "<span class='simileyIcon s41'></span>");
		msg = msg.replace(/\(clap\)/gi, "<span class='simileyIcon s42'></span>");
		msg = msg.replace(/\(think\)/gi, "<span class='simileyIcon s43'></span>");
		msg = msg.replace(/\(emo\)/gi, "<span class='simileyIcon s44'></span>");
		msg = msg.replace(/\(rofl\)/gi, "<span class='simileyIcon s45'></span>");
		
		msg = msg.replace(/\(whew\)/gi, "<span class='simileyIcon s46'></span>");
		msg = msg.replace(/\(happy\)/gi, "<span class='simileyIcon s47'></span>");
		msg = msg.replace(/\(nod\)/gi, "<span class='simileyIcon s48'></span>");
		msg = msg.replace(/\(shake\)/gi, "<span class='simileyIcon s49'></span>");
		msg = msg.replace(/\(smirk\)/gi, "<span class='simileyIcon s50'></span>");
		
		msg = msg.replace(/\(punch\)/gi, "<span class='simileyIcon s51'></span>");
		msg = msg.replace(/\(bow\)/gi, "<span class='simileyIcon s52'></span>");
		msg = msg.replace(/\(hug\)/gi, "<span class='simileyIcon s53'></span>");
		msg = msg.replace(/\(y\)/gi, "<span class='simileyIcon s54'></span>");
		msg = msg.replace(/\(n\)/gi, "<span class='simileyIcon s55'></span>");
		
		msg = msg.replace(/\(handshake\)/gi, "<span class='simileyIcon s56'></span>");
		msg = msg.replace(/\(skype\)/gi, "<span class='simileyIcon s57'></span>");
		msg = msg.replace(/\(L\)/gi, "<span class='simileyIcon s58'></span>");
		msg = msg.replace(/\(u\)/gi, "<span class='simileyIcon s59'></span>");
		msg = msg.replace(/\(e\)/gi, "<span class='simileyIcon s60'></span>");
		
		msg = msg.replace(/\(F\)/gi, "<span class='simileyIcon s61'></span>");
		msg = msg.replace(/\(rain\)/gi, "<span class='simileyIcon s62'></span>");
		msg = msg.replace(/\(sun\)/gi, "<span class='simileyIcon s63'></span>");
		msg = msg.replace(/\(o\)/gi, "<span class='simileyIcon s64'></span>");
		msg = msg.replace(/\(music\)/gi, "<span class='simileyIcon s65'></span>");
		
		msg = msg.replace(/\(\~\)/gi, "<span class='simileyIcon s66'></span>");
		msg = msg.replace(/\(mp\)/gi, "<span class='simileyIcon s67'></span>");
		msg = msg.replace(/\(coffee\)/gi, "<span class='simileyIcon s68'></span>");
		msg = msg.replace(/\(pizza\)/gi, "<span class='simileyIcon s69'></span>");
		msg = msg.replace(/\(cash\)/gi, "<span class='simileyIcon s70'></span>");
		
		msg = msg.replace(/\(\~\)/gi, "<span class='simileyIcon s71'></span>");
		msg = msg.replace(/\(mp\)/gi, "<span class='simileyIcon s72'></span>");
		msg = msg.replace(/\(coffee\)/gi, "<span class='simileyIcon s73'></span>");
		msg = msg.replace(/\(pizza\)/gi, "<span class='simileyIcon s74'></span>");
		msg = msg.replace(/\(cash\)/gi, "<span class='simileyIcon s75'></span>");
		
		
		return(msg);
	}
	//---------------------------------
	
	// Focus on window
	$(window).focus(function()
	{
		tabFocus = true;
		$("title").html(PAGE_TITLE);
	});
	//----------------
	
	// Blur from window
	$(window).blur(function()
	{
		tabFocus = false;
	});
	//-----------------
});