exports.DatListWidget=DatListWidget;

function DatListWidget() {
	this.element=function() {return m_element;};
	this.on=function(name,callback) {m_element.on(name,callback);};
	this.refresh=function() {refresh();};

	var m_element=$('<span />');
	var m_table=$('<table class=table />');
	m_element.append(m_table);

	refresh();

	function refresh() {
		m_table.empty();
		m_table.append(`<tr><th style="width:1px"></th><th>Dat key</th></tr>`);
		$.getJSON('/../api/list',function(resp) {
			if (resp.error) {
				throw resp.error;
			}
			var keys=resp.keys||[];
			for (var i=0; i<keys.length; i++) {
				var row=$('<tr></tr>');
				row.append('<td id=buttons></td>')
				row.append('<td id=dat_key></td>')
				row.key=keys[i];
				m_table.append(row);
				update_row(row);
			}
		});
	}
	function update_row(row) {
		row.find('td').empty();

		var remove_button=$('<span class="octicon octicon-trashcan"></span>')
		remove_button.attr('title','Remove this dat');
		row.find('#buttons').append(remove_button);
		remove_button.click(function() {
			m_element.trigger('remove_dat',{key:row.key});
		});
		
		var link=$('<a href=#></a>')
		link.attr('title',row.key);
		link.html(shorten_key(row.key,10));
		row.find('#dat_key').append(link);
		link.click(function() {
			m_element.trigger('open_dat',{key:row.key});
		});
	}
	function shorten_key(key,num) {
		return key.slice(0,num)+'...';
	}
}

