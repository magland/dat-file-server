var DatListWidget=require(__dirname+'/datlistwidget.js').DatListWidget;
var DatWidget=require(__dirname+'/datwidget.js').DatWidget;

$(document).ready(function() {
	var W=new DFSMainWindow();
	$('#main_window').append(W.element());
});

function DFSMainWindow() {
	this.element=function() {return m_element;};

	var m_element=$(`
		<span>
			<div class="ml-vlayout">
				<div class="ml-vlayout-item" style="flex:20px 0 0">
					<span style="padding-left:20px">
						<a href=# id=add_dat>Add dat...</a>
					</span>
				</div>
				<div class="ml-vlayout-item" style="flex:1">
					<div class="ml-hlayout">
						<div class="ml-hlayout-item" style="flex:500px 0 0">
							<div class="ml-item-content" id="dat_list" style="margin:10px; background: lightgray">
							</div>
						</div>
						<div class="ml-hlayout-item" style="flex:1">
							<div class="ml-item-content" id="dat_widget" style="margin:10px; background: lightgray">
							</div>
						</div>
					</div>
				</div
			</div>
		</span>
	`);

	var dat_list_widget=new DatListWidget();
	m_element.find('#dat_list').append(dat_list_widget.element());

	var dat_widget=new DatWidget();
	m_element.find('#dat_widget').append(dat_widget.element());

	dat_list_widget.on('open_dat',function(evt,args) {
		dat_widget.setDatKey(args.key);	
	});

	m_element.find('#add_dat').click(add_dat);

	dat_list_widget.on('remove_dat',function(evt,args) {
		$.getJSON(`/api/remove/${args.key}`,function(resp) {
			if (!resp.success) {
				throw resp.error;
			}
			dat_list_widget.refresh();
			if (dat_widget.datKey()==args.key) {
				dat_widget.setDatKey('');
			}
		});
	});

	function add_dat() {
		var key=prompt('Enter dat key:','');
		if (!key) return;
		$.getJSON(`/api/add/${key}`,function(resp) {
			if (!resp.success) {
				throw resp.error;
			}
			dat_list_widget.refresh();
			dat_widget.setDatKey(key);
		});
	}
}