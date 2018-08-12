"use strict";

/* Tabulator v4.0.0 (c) Oliver Folkerd */

var ResizeColumns = function ResizeColumns(table) {
	this.table = table; //hold Tabulator object
	this.startColumn = false;
	this.startX = false;
	this.startWidth = false;
	this.handle = null;
	this.prevHandle = null;
};

ResizeColumns.prototype.initializeColumn = function (type, column, element) {
	var self = this,
	    variableHeight = false,
	    mode = this.table.options.resizableColumns;

	//set column resize mode
	if (type === "header") {
		variableHeight = column.definition.formatter == "textarea" || column.definition.variableHeight;
		column.modules.resize = { variableHeight: variableHeight };
	}

	if (mode === true || mode == type) {

		var handle = document.createElement('div');
		handle.className = "tabulator-col-resize-handle";

		var prevHandle = document.createElement('div');
		prevHandle.className = "tabulator-col-resize-handle prev";

		handle.addEventListener("click", function (e) {
			e.stopPropagation();
		});

		handle.addEventListener("mousedown", function (e) {
			var nearestColumn = column.getLastColumn();

			if (nearestColumn && self._checkResizability(nearestColumn)) {
				self.startColumn = column;
				self._mouseDown(e, nearestColumn);
			}
		});

		//reszie column on  double click
		handle.addEventListener("dblclick", function (e) {
			if (self._checkResizability(column)) {
				column.reinitializeWidth(true);
			}
		});

		prevHandle.addEventListener("click", function (e) {
			e.stopPropagation();
		});

		prevHandle.addEventListener("mousedown", function (e) {
			var nearestColumn, colIndex, prevColumn;

			nearestColumn = column.getFirstColumn();

			if (nearestColumn) {
				colIndex = self.table.columnManager.findColumnIndex(nearestColumn);
				prevColumn = colIndex > 0 ? self.table.columnManager.getColumnByIndex(colIndex - 1) : false;

				if (prevColumn && self._checkResizability(prevColumn)) {
					self.startColumn = column;
					self._mouseDown(e, prevColumn);
				}
			}
		});

		//resize column on double click
		prevHandle.addEventListener("dblclick", function (e) {
			var nearestColumn, colIndex, prevColumn;

			nearestColumn = column.getFirstColumn();

			if (nearestColumn) {
				colIndex = self.table.columnManager.findColumnIndex(nearestColumn);
				prevColumn = colIndex > 0 ? self.table.columnManager.getColumnByIndex(colIndex - 1) : false;

				if (prevColumn && self._checkResizability(prevColumn)) {
					prevColumn.reinitializeWidth(true);
				}
			}
		});

		//TEMPORARY BODGE UNTILL CELSS ARE DE JQUERIED
		if (element.appendChild) {
			element.appendChild(handle);
			element.appendChild(prevHandle);
		} else {
			element.append(handle);
			element.append(prevHandle);
		}
	}
};

ResizeColumns.prototype._checkResizability = function (column) {
	return typeof column.definition.resizable != "undefined" ? column.definition.resizable : this.table.options.resizableColumns;
};

ResizeColumns.prototype._mouseDown = function (e, column) {
	var self = this;

	self.table.element.classList.add("tabulator-block-select");

	function mouseMove(e) {
		column.setWidth(self.startWidth + (e.screenX - self.startX));

		if (!self.table.browserSlow && column.modules.resize && column.modules.resize.variableHeight) {
			column.checkCellHeights();
		}
	}

	function mouseUp(e) {

		//block editor from taking action while resizing is taking place
		if (self.startColumn.modules.edit) {
			self.startColumn.modules.edit.blocked = false;
		}

		if (self.table.browserSlow && column.modules.resize && column.modules.resize.variableHeight) {
			column.checkCellHeights();
		}

		$("body").off("mouseup", mouseMove);
		$("body").off("mousemove", mouseMove);

		self.table.element.classList.remove("tabulator-block-select");

		if (self.table.options.persistentLayout && self.table.modExists("persistence", true)) {
			self.table.modules.persistence.save("columns");
		}

		self.table.options.columnResized(self.startColumn.getComponent());
	}

	e.stopPropagation(); //prevent resize from interfereing with movable columns

	//block editor from taking action while resizing is taking place
	if (self.startColumn.modules.edit) {
		self.startColumn.modules.edit.blocked = true;
	}

	self.startX = e.screenX;
	self.startWidth = column.getWidth();

	$("body").on("mousemove", mouseMove);

	$("body").on("mouseup", mouseUp);
};

Tabulator.prototype.registerModule("resizeColumns", ResizeColumns);