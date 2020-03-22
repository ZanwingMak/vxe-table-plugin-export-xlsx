"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.VXETablePluginExportXLSX = void 0;

var _xeUtils = _interopRequireDefault(require("xe-utils/methods/xe-utils"));

var _xlsx = _interopRequireDefault(require("xlsx"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function getFooterCellValue($table, opts, rows, column) {
  var cellValue = _xeUtils["default"].toString(rows[$table.$getColumnIndex(column)]);

  return cellValue;
}

function toBuffer(wbout) {
  var buf = new ArrayBuffer(wbout.length);
  var view = new Uint8Array(buf);

  for (var index = 0; index !== wbout.length; ++index) {
    view[index] = wbout.charCodeAt(index) & 0xFF;
  }

  return buf;
}

function exportXLSX(params) {
  var $table = params.$table,
      options = params.options,
      columns = params.columns,
      datas = params.datas;
  var sheetName = options.sheetName,
      type = options.type,
      isHeader = options.isHeader,
      isFooter = options.isFooter,
      original = options.original,
      message = options.message,
      footerFilterMethod = options.footerFilterMethod;
  var colHead = {};
  var footList = [];
  var rowList = datas;

  if (isHeader) {
    columns.forEach(function (column) {
      colHead[column.id] = _xeUtils["default"].toString(original ? column.property : column.getTitle());
    });
  }

  if (isFooter) {
    var _$table$getTableData = $table.getTableData(),
        footerData = _$table$getTableData.footerData;

    var footers = footerFilterMethod ? footerData.filter(footerFilterMethod) : footerData;
    footers.forEach(function (rows) {
      var item = {};
      columns.forEach(function (column) {
        item[column.id] = getFooterCellValue($table, options, rows, column);
      });
      footList.push(item);
    });
  }

  var book = _xlsx["default"].utils.book_new();

  var sheet = _xlsx["default"].utils.json_to_sheet((isHeader ? [colHead] : []).concat(rowList).concat(footList), {
    skipHeader: true
  }); // 转换数据


  _xlsx["default"].utils.book_append_sheet(book, sheet, sheetName);

  var wbout = _xlsx["default"].write(book, {
    bookType: type,
    bookSST: false,
    type: 'binary'
  });

  var blob = new Blob([toBuffer(wbout)], {
    type: 'application/octet-stream'
  }); // 保存导出

  downloadFile(blob, options);

  if (message !== false) {
    $table.$XModal.message({
      message: i18n('vxe.table.expSuccess'),
      status: 'success'
    });
  }
}

function downloadFile(blob, options) {
  if (window.Blob) {
    var filename = options.filename,
        type = options.type;

    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, "".concat(filename, ".").concat(type));
    } else {
      var linkElem = document.createElement('a');
      linkElem.target = '_blank';
      linkElem.download = "".concat(filename, ".").concat(type);
      linkElem.href = URL.createObjectURL(blob);
      document.body.appendChild(linkElem);
      linkElem.click();
      document.body.removeChild(linkElem);
    }
  } else {
    console.error(i18n('vxe.error.notExp'));
  }
}

function replaceDoubleQuotation(val) {
  return val.replace(/^"/, '').replace(/"$/, '');
}

function parseCsv(columns, content) {
  var list = content.split('\n');
  var fields = [];
  var rows = [];

  if (list.length) {
    var rList = list.slice(1);
    list[0].split(',').map(replaceDoubleQuotation);
    rList.forEach(function (r) {
      if (r) {
        var item = {};
        r.split(',').forEach(function (val, colIndex) {
          if (fields[colIndex]) {
            item[fields[colIndex]] = replaceDoubleQuotation(val);
          }
        });
        rows.push(item);
      }
    });
  }

  return {
    fields: fields,
    rows: rows
  };
}

function checkImportData(columns, fields, rows) {
  var tableFields = [];
  columns.forEach(function (column) {
    var field = column.property;

    if (field) {
      tableFields.push(field);
    }
  });
  return tableFields.every(function (field) {
    return fields.includes(field);
  });
}

function importXLSX(params) {
  var columns = params.columns,
      options = params.options,
      file = params.file;
  var $table = params.$table;
  var _importResolve = $table._importResolve;
  var fileReader = new FileReader();

  fileReader.onload = function (e) {
    var workbook = _xlsx["default"].read(e.target.result, {
      type: 'binary'
    });

    var csvData = _xlsx["default"].utils.sheet_to_csv(workbook.Sheets.Sheet1);

    var _parseCsv = parseCsv(columns, csvData),
        fields = _parseCsv.fields,
        rows = _parseCsv.rows;

    var status = checkImportData(columns, fields, rows);

    if (status) {
      $table.createData(rows).then(function (data) {
        if (options.mode === 'append') {
          $table.insertAt(data, -1);
        } else {
          $table.reloadData(data);
        }
      });

      if (options.message !== false) {
        $table.$XModal.message({
          message: _xeUtils["default"].template(i18n('vxe.table.impSuccess'), [rows.length]),
          status: 'success'
        });
      }
    } else if (options.message !== false) {
      $table.$XModal.message({
        message: i18n('vxe.error.impFields'),
        status: 'error'
      });
    }

    if (_importResolve) {
      _importResolve(status);

      $table._importResolve = null;
    }
  };

  fileReader.readAsBinaryString(file);
}

function handleImportEvent(params) {
  if (params.options.type === 'xlsx') {
    importXLSX(params);
    return false;
  }
}

function handleExportEvent(params) {
  if (params.options.type === 'xlsx') {
    exportXLSX(params);
    return false;
  }
}
/**
 * 基于 vxe-table 表格的增强插件，支持导出 xlsx 格式
 */


var VXETablePluginExportXLSX = {
  install: function install(xtable) {
    Object.assign(xtable.types, {
      xlsx: 1
    });
    xtable.interceptor.mixin({
      'event.import': handleImportEvent,
      'event.export': handleExportEvent
    });
    VXETablePluginExportXLSX.t = xtable.t;
  }
};
exports.VXETablePluginExportXLSX = VXETablePluginExportXLSX;

function i18n(key) {
  if (VXETablePluginExportXLSX.t) {
    return VXETablePluginExportXLSX.t(key);
  }
}

if (typeof window !== 'undefined' && window.VXETable) {
  window.VXETable.use(VXETablePluginExportXLSX);
}

var _default = VXETablePluginExportXLSX;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sIm5hbWVzIjpbImdldEZvb3RlckNlbGxWYWx1ZSIsIiR0YWJsZSIsIm9wdHMiLCJyb3dzIiwiY29sdW1uIiwiY2VsbFZhbHVlIiwiWEVVdGlscyIsInRvU3RyaW5nIiwiJGdldENvbHVtbkluZGV4IiwidG9CdWZmZXIiLCJ3Ym91dCIsImJ1ZiIsIkFycmF5QnVmZmVyIiwibGVuZ3RoIiwidmlldyIsIlVpbnQ4QXJyYXkiLCJpbmRleCIsImNoYXJDb2RlQXQiLCJleHBvcnRYTFNYIiwicGFyYW1zIiwib3B0aW9ucyIsImNvbHVtbnMiLCJkYXRhcyIsInNoZWV0TmFtZSIsInR5cGUiLCJpc0hlYWRlciIsImlzRm9vdGVyIiwib3JpZ2luYWwiLCJtZXNzYWdlIiwiZm9vdGVyRmlsdGVyTWV0aG9kIiwiY29sSGVhZCIsImZvb3RMaXN0Iiwicm93TGlzdCIsImZvckVhY2giLCJpZCIsInByb3BlcnR5IiwiZ2V0VGl0bGUiLCJnZXRUYWJsZURhdGEiLCJmb290ZXJEYXRhIiwiZm9vdGVycyIsImZpbHRlciIsIml0ZW0iLCJwdXNoIiwiYm9vayIsIlhMU1giLCJ1dGlscyIsImJvb2tfbmV3Iiwic2hlZXQiLCJqc29uX3RvX3NoZWV0IiwiY29uY2F0Iiwic2tpcEhlYWRlciIsImJvb2tfYXBwZW5kX3NoZWV0Iiwid3JpdGUiLCJib29rVHlwZSIsImJvb2tTU1QiLCJibG9iIiwiQmxvYiIsImRvd25sb2FkRmlsZSIsIiRYTW9kYWwiLCJpMThuIiwic3RhdHVzIiwid2luZG93IiwiZmlsZW5hbWUiLCJuYXZpZ2F0b3IiLCJtc1NhdmVCbG9iIiwibGlua0VsZW0iLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJ0YXJnZXQiLCJkb3dubG9hZCIsImhyZWYiLCJVUkwiLCJjcmVhdGVPYmplY3RVUkwiLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJjbGljayIsInJlbW92ZUNoaWxkIiwiY29uc29sZSIsImVycm9yIiwicmVwbGFjZURvdWJsZVF1b3RhdGlvbiIsInZhbCIsInJlcGxhY2UiLCJwYXJzZUNzdiIsImNvbnRlbnQiLCJsaXN0Iiwic3BsaXQiLCJmaWVsZHMiLCJyTGlzdCIsInNsaWNlIiwibWFwIiwiciIsImNvbEluZGV4IiwiY2hlY2tJbXBvcnREYXRhIiwidGFibGVGaWVsZHMiLCJmaWVsZCIsImV2ZXJ5IiwiaW5jbHVkZXMiLCJpbXBvcnRYTFNYIiwiZmlsZSIsIl9pbXBvcnRSZXNvbHZlIiwiZmlsZVJlYWRlciIsIkZpbGVSZWFkZXIiLCJvbmxvYWQiLCJlIiwid29ya2Jvb2siLCJyZWFkIiwicmVzdWx0IiwiY3N2RGF0YSIsInNoZWV0X3RvX2NzdiIsIlNoZWV0cyIsIlNoZWV0MSIsImNyZWF0ZURhdGEiLCJ0aGVuIiwiZGF0YSIsIm1vZGUiLCJpbnNlcnRBdCIsInJlbG9hZERhdGEiLCJ0ZW1wbGF0ZSIsInJlYWRBc0JpbmFyeVN0cmluZyIsImhhbmRsZUltcG9ydEV2ZW50IiwiaGFuZGxlRXhwb3J0RXZlbnQiLCJWWEVUYWJsZVBsdWdpbkV4cG9ydFhMU1giLCJpbnN0YWxsIiwieHRhYmxlIiwiT2JqZWN0IiwiYXNzaWduIiwidHlwZXMiLCJ4bHN4IiwiaW50ZXJjZXB0b3IiLCJtaXhpbiIsInQiLCJrZXkiLCJWWEVUYWJsZSIsInVzZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUVBOzs7O0FBRUEsU0FBU0Esa0JBQVQsQ0FBNkJDLE1BQTdCLEVBQTRDQyxJQUE1QyxFQUFnRUMsSUFBaEUsRUFBNkVDLE1BQTdFLEVBQWlHO0FBQy9GLE1BQUlDLFNBQVMsR0FBR0Msb0JBQVFDLFFBQVIsQ0FBaUJKLElBQUksQ0FBQ0YsTUFBTSxDQUFDTyxlQUFQLENBQXVCSixNQUF2QixDQUFELENBQXJCLENBQWhCOztBQUNBLFNBQU9DLFNBQVA7QUFDRDs7QUFFRCxTQUFTSSxRQUFULENBQW1CQyxLQUFuQixFQUE2QjtBQUMzQixNQUFJQyxHQUFHLEdBQUcsSUFBSUMsV0FBSixDQUFnQkYsS0FBSyxDQUFDRyxNQUF0QixDQUFWO0FBQ0EsTUFB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TixJQUFBQSxVQUFVLENBQUNDLE1BQUQsQ0FBVjtBQUNBLFdBQU8sS0FBUDtBQUNEO0FBQ0Y7QUFFRDs7Ozs7QUFHTyxJQUFNc0csd0JBQXdCLEdBQVE7QUFDM0NDLEVBQUFBLE9BRDJDLG1CQUNsQ0MsTUFEa0MsRUFDWDtBQUM5QkMsSUFBQUEsTUFBTSxDQUFDQyxNQUFQLENBQWNGLE1BQU0sQ0FBQ0csS0FBckIsRUFBNEI7QUFBRUMsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FBNUI7QUFDQUosSUFBQUEsTUFBTSxDQUFDSyxXQUFQLENBQW1CQyxLQUFuQixDQUF5QjtBQUN2QixzQkFBZ0JWLGlCQURPO0FBRXZCLHNCQUFnQkM7QUFGTyxLQUF6QjtBQUlBQyxJQUFBQSx3QkFBd0IsQ0FBQ1MsQ0FBekIsR0FBNkJQLE1BQU0sQ0FBQ08sQ0FBcEM7QUFDRDtBQVIwQyxDQUF0Qzs7O0FBV1AsU0FBU3ZFLElBQVQsQ0FBZXdFLEdBQWYsRUFBMEI7QUFDeEIsTUFBSVYsd0JBQXdCLENBQUNTLENBQTdCLEVBQWdDO0FBQzlCLFdBQU9ULHdCQUF3QixDQUFDUyxDQUF6QixDQUEyQkMsR0FBM0IsQ0FBUDtBQUNEO0FBQ0Y7O0FBRUQsSUFBSSxPQUFPdEUsTUFBUCxLQUFrQixXQUFsQixJQUFpQ0EsTUFBTSxDQUFDdUUsUUFBNUMsRUFBc0Q7QUFDcER2RSxFQUFBQSxNQUFNLENBQUN1RSxRQUFQLENBQWdCQyxHQUFoQixDQUFvQlosd0JBQXBCO0FBQ0Q7O2VBRWNBLHdCIiwiZmlsZSI6ImluZGV4LmNvbW1vbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBYRVV0aWxzIGZyb20gJ3hlLXV0aWxzL21ldGhvZHMveGUtdXRpbHMnXHJcbmltcG9ydCB7IFZYRVRhYmxlLCBUYWJsZSwgSW50ZXJjZXB0b3JFeHBvcnRQYXJhbXMsIEludGVyY2VwdG9ySW1wb3J0UGFyYW1zLCBDb2x1bW5Db25maWcsIEV4cG9ydE9wdG9ucyB9IGZyb20gJ3Z4ZS10YWJsZS9saWIvdnhlLXRhYmxlJyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXHJcbmltcG9ydCBYTFNYIGZyb20gJ3hsc3gnXHJcblxyXG5mdW5jdGlvbiBnZXRGb290ZXJDZWxsVmFsdWUgKCR0YWJsZTogVGFibGUsIG9wdHM6IEV4cG9ydE9wdG9ucywgcm93czogYW55W10sIGNvbHVtbjogQ29sdW1uQ29uZmlnKSB7XHJcbiAgdmFyIGNlbGxWYWx1ZSA9IFhFVXRpbHMudG9TdHJpbmcocm93c1skdGFibGUuJGdldENvbHVtbkluZGV4KGNvbHVtbildKVxyXG4gIHJldHVybiBjZWxsVmFsdWVcclxufVxyXG5cclxuZnVuY3Rpb24gdG9CdWZmZXIgKHdib3V0OiBhbnkpIHtcclxuICBsZXQgYnVmID0gbmV3IEFycmF5QnVmZmVyKHdib3V0Lmxlbmd0aClcclxuICBsZXQgdmlldyA9IG5ldyBVaW50OEFycmF5KGJ1ZilcclxuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4ICE9PSB3Ym91dC5sZW5ndGg7ICsraW5kZXgpIHZpZXdbaW5kZXhdID0gd2JvdXQuY2hhckNvZGVBdChpbmRleCkgJiAweEZGXHJcbiAgcmV0dXJuIGJ1ZlxyXG59XHJcblxyXG5mdW5jdGlvbiBleHBvcnRYTFNYIChwYXJhbXM6IEludGVyY2VwdG9yRXhwb3J0UGFyYW1zKSB7XHJcbiAgY29uc3QgeyAkdGFibGUsIG9wdGlvbnMsIGNvbHVtbnMsIGRhdGFzIH0gPSBwYXJhbXNcclxuICBjb25zdCB7IHNoZWV0TmFtZSwgdHlwZSwgaXNIZWFkZXIsIGlzRm9vdGVyLCBvcmlnaW5hbCwgbWVzc2FnZSwgZm9vdGVyRmlsdGVyTWV0aG9kIH0gPSBvcHRpb25zXHJcbiAgY29uc3QgY29sSGVhZDogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHt9XHJcbiAgY29uc3QgZm9vdExpc3Q6IHsgW2tleTogc3RyaW5nXTogYW55IH1bXSA9IFtdXHJcbiAgY29uc3Qgcm93TGlzdCA9IGRhdGFzXHJcbiAgaWYgKGlzSGVhZGVyKSB7XHJcbiAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xyXG4gICAgICBjb2xIZWFkW2NvbHVtbi5pZF0gPSBYRVV0aWxzLnRvU3RyaW5nKG9yaWdpbmFsID8gY29sdW1uLnByb3BlcnR5IDogY29sdW1uLmdldFRpdGxlKCkpXHJcbiAgICB9KVxyXG4gIH1cclxuICBpZiAoaXNGb290ZXIpIHtcclxuICAgIGNvbnN0IHsgZm9vdGVyRGF0YSB9ID0gJHRhYmxlLmdldFRhYmxlRGF0YSgpXHJcbiAgICBjb25zdCBmb290ZXJzID0gZm9vdGVyRmlsdGVyTWV0aG9kID8gZm9vdGVyRGF0YS5maWx0ZXIoZm9vdGVyRmlsdGVyTWV0aG9kKSA6IGZvb3RlckRhdGFcclxuICAgIGZvb3RlcnMuZm9yRWFjaCgocm93cykgPT4ge1xyXG4gICAgICBjb25zdCBpdGVtOiBhbnkgPSB7fVxyXG4gICAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xyXG4gICAgICAgIGl0ZW1bY29sdW1uLmlkXSA9IGdldEZvb3RlckNlbGxWYWx1ZSgkdGFibGUsIG9wdGlvbnMsIHJvd3MsIGNvbHVtbilcclxuICAgICAgfSlcclxuICAgICAgZm9vdExpc3QucHVzaChpdGVtKVxyXG4gICAgfSlcclxuICB9XHJcbiAgY29uc3QgYm9vayA9IFhMU1gudXRpbHMuYm9va19uZXcoKVxyXG4gIGNvbnN0IHNoZWV0ID0gWExTWC51dGlscy5qc29uX3RvX3NoZWV0KChpc0hlYWRlciA/IFtjb2xIZWFkXSA6IFtdKS5jb25jYXQocm93TGlzdCkuY29uY2F0KGZvb3RMaXN0KSwgeyBza2lwSGVhZGVyOiB0cnVlIH0pXHJcbiAgLy8g6L2s5o2i5pWw5o2uXHJcbiAgWExTWC51dGlscy5ib29rX2FwcGVuZF9zaGVldChib29rLCBzaGVldCwgc2hlZXROYW1lKVxyXG4gIGNvbnN0IHdib3V0ID0gWExTWC53cml0ZShib29rLCB7IGJvb2tUeXBlOiB0eXBlLCBib29rU1NUOiBmYWxzZSwgdHlwZTogJ2JpbmFyeScgfSlcclxuICBjb25zdCBibG9iID0gbmV3IEJsb2IoW3RvQnVmZmVyKHdib3V0KV0sIHsgdHlwZTogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScgfSlcclxuICAvLyDkv53lrZjlr7zlh7pcclxuICBkb3dubG9hZEZpbGUoYmxvYiwgb3B0aW9ucylcclxuICBpZiAobWVzc2FnZSAhPT0gZmFsc2UpIHtcclxuICAgICR0YWJsZS4kWE1vZGFsLm1lc3NhZ2UoeyBtZXNzYWdlOiBpMThuKCd2eGUudGFibGUuZXhwU3VjY2VzcycpLCBzdGF0dXM6ICdzdWNjZXNzJyB9KVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZG93bmxvYWRGaWxlIChibG9iOiBCbG9iLCBvcHRpb25zOiBFeHBvcnRPcHRvbnMpIHtcclxuICBpZiAod2luZG93LkJsb2IpIHtcclxuICAgIGNvbnN0IHsgZmlsZW5hbWUsIHR5cGUgfSA9IG9wdGlvbnNcclxuICAgIGlmIChuYXZpZ2F0b3IubXNTYXZlQmxvYikge1xyXG4gICAgICBuYXZpZ2F0b3IubXNTYXZlQmxvYihibG9iLCBgJHtmaWxlbmFtZX0uJHt0eXBlfWApXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXIgbGlua0VsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJylcclxuICAgICAgbGlua0VsZW0udGFyZ2V0ID0gJ19ibGFuaydcclxuICAgICAgbGlua0VsZW0uZG93bmxvYWQgPSBgJHtmaWxlbmFtZX0uJHt0eXBlfWBcclxuICAgICAgbGlua0VsZW0uaHJlZiA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYilcclxuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChsaW5rRWxlbSlcclxuICAgICAgbGlua0VsZW0uY2xpY2soKVxyXG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGxpbmtFbGVtKVxyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zb2xlLmVycm9yKGkxOG4oJ3Z4ZS5lcnJvci5ub3RFeHAnKSlcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlcGxhY2VEb3VibGVRdW90YXRpb24gKHZhbDogc3RyaW5nKSB7XHJcbiAgcmV0dXJuIHZhbC5yZXBsYWNlKC9eXCIvLCAnJykucmVwbGFjZSgvXCIkLywgJycpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlQ3N2IChjb2x1bW5zOiBDb2x1bW5Db25maWdbXSwgY29udGVudDogc3RyaW5nKSB7XHJcbiAgY29uc3QgbGlzdCA9IGNvbnRlbnQuc3BsaXQoJ1xcbicpXHJcbiAgY29uc3QgZmllbGRzOiBzdHJpbmdbXSA9IFtdXHJcbiAgY29uc3Qgcm93czogYW55W10gPSBbXVxyXG4gIGlmIChsaXN0Lmxlbmd0aCkge1xyXG4gICAgY29uc3Qgckxpc3QgPSBsaXN0LnNsaWNlKDEpXHJcbiAgICBsaXN0WzBdLnNwbGl0KCcsJykubWFwKHJlcGxhY2VEb3VibGVRdW90YXRpb24pXHJcbiAgICByTGlzdC5mb3JFYWNoKChyKSA9PiB7XHJcbiAgICAgIGlmIChyKSB7XHJcbiAgICAgICAgY29uc3QgaXRlbTogYW55ID0ge31cclxuICAgICAgICByLnNwbGl0KCcsJykuZm9yRWFjaCgodmFsLCBjb2xJbmRleCkgPT4ge1xyXG4gICAgICAgICAgaWYgKGZpZWxkc1tjb2xJbmRleF0pIHtcclxuICAgICAgICAgICAgaXRlbVtmaWVsZHNbY29sSW5kZXhdXSA9IHJlcGxhY2VEb3VibGVRdW90YXRpb24odmFsKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcm93cy5wdXNoKGl0ZW0pXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG4gIHJldHVybiB7IGZpZWxkcywgcm93cyB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrSW1wb3J0RGF0YSAoY29sdW1uczogQ29sdW1uQ29uZmlnW10sIGZpZWxkczogc3RyaW5nW10sIHJvd3M6IGFueVtdKSB7XHJcbiAgbGV0IHRhYmxlRmllbGRzOiBzdHJpbmdbXSA9IFtdXHJcbiAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcclxuICAgIGxldCBmaWVsZCA9IGNvbHVtbi5wcm9wZXJ0eVxyXG4gICAgaWYgKGZpZWxkKSB7XHJcbiAgICAgIHRhYmxlRmllbGRzLnB1c2goZmllbGQpXHJcbiAgICB9XHJcbiAgfSlcclxuICByZXR1cm4gdGFibGVGaWVsZHMuZXZlcnkoKGZpZWxkKSA9PiBmaWVsZHMuaW5jbHVkZXMoZmllbGQpKVxyXG59XHJcblxyXG5mdW5jdGlvbiBpbXBvcnRYTFNYIChwYXJhbXM6IEludGVyY2VwdG9ySW1wb3J0UGFyYW1zKSB7XHJcbiAgY29uc3QgeyBjb2x1bW5zLCBvcHRpb25zLCBmaWxlIH0gPSBwYXJhbXNcclxuICBjb25zdCAkdGFibGU6IGFueSA9IHBhcmFtcy4kdGFibGVcclxuICBjb25zdCB7IF9pbXBvcnRSZXNvbHZlIH0gPSAkdGFibGVcclxuICBjb25zdCBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxyXG4gIGZpbGVSZWFkZXIub25sb2FkID0gKGU6IGFueSkgPT4ge1xyXG4gICAgY29uc3Qgd29ya2Jvb2sgPSBYTFNYLnJlYWQoZS50YXJnZXQucmVzdWx0LCB7IHR5cGU6ICdiaW5hcnknIH0pXHJcbiAgICBjb25zdCBjc3ZEYXRhOiBzdHJpbmcgPSBYTFNYLnV0aWxzLnNoZWV0X3RvX2Nzdih3b3JrYm9vay5TaGVldHMuU2hlZXQxKVxyXG4gICAgY29uc3QgeyBmaWVsZHMsIHJvd3MgfSA9IHBhcnNlQ3N2KGNvbHVtbnMsIGNzdkRhdGEpXHJcbiAgICBjb25zdCBzdGF0dXMgPSBjaGVja0ltcG9ydERhdGEoY29sdW1ucywgZmllbGRzLCByb3dzKVxyXG4gICAgaWYgKHN0YXR1cykge1xyXG4gICAgICAkdGFibGUuY3JlYXRlRGF0YShyb3dzKVxyXG4gICAgICAgIC50aGVuKChkYXRhOiBhbnlbXSkgPT4ge1xyXG4gICAgICAgICAgaWYgKG9wdGlvbnMubW9kZSA9PT0gJ2FwcGVuZCcpIHtcclxuICAgICAgICAgICAgJHRhYmxlLmluc2VydEF0KGRhdGEsIC0xKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJHRhYmxlLnJlbG9hZERhdGEoZGF0YSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICBpZiAob3B0aW9ucy5tZXNzYWdlICE9PSBmYWxzZSkge1xyXG4gICAgICAgICR0YWJsZS4kWE1vZGFsLm1lc3NhZ2UoeyBtZXNzYWdlOiBYRVV0aWxzLnRlbXBsYXRlKGkxOG4oJ3Z4ZS50YWJsZS5pbXBTdWNjZXNzJyksIFtyb3dzLmxlbmd0aF0pLCBzdGF0dXM6ICdzdWNjZXNzJyB9KVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMubWVzc2FnZSAhPT0gZmFsc2UpIHtcclxuICAgICAgJHRhYmxlLiRYTW9kYWwubWVzc2FnZSh7IG1lc3NhZ2U6IGkxOG4oJ3Z4ZS5lcnJvci5pbXBGaWVsZHMnKSwgc3RhdHVzOiAnZXJyb3InIH0pXHJcbiAgICB9XHJcbiAgICBpZiAoX2ltcG9ydFJlc29sdmUpIHtcclxuICAgICAgX2ltcG9ydFJlc29sdmUoc3RhdHVzKVxyXG4gICAgICAkdGFibGUuX2ltcG9ydFJlc29sdmUgPSBudWxsXHJcbiAgICB9XHJcbiAgfVxyXG4gIGZpbGVSZWFkZXIucmVhZEFzQmluYXJ5U3RyaW5nKGZpbGUpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhbmRsZUltcG9ydEV2ZW50IChwYXJhbXM6IEludGVyY2VwdG9ySW1wb3J0UGFyYW1zKSB7XHJcbiAgaWYgKHBhcmFtcy5vcHRpb25zLnR5cGUgPT09ICd4bHN4Jykge1xyXG4gICAgaW1wb3J0WExTWChwYXJhbXMpXHJcbiAgICByZXR1cm4gZmFsc2VcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhbmRsZUV4cG9ydEV2ZW50IChwYXJhbXM6IEludGVyY2VwdG9yRXhwb3J0UGFyYW1zKSB7XHJcbiAgaWYgKHBhcmFtcy5vcHRpb25zLnR5cGUgPT09ICd4bHN4Jykge1xyXG4gICAgZXhwb3J0WExTWChwYXJhbXMpXHJcbiAgICByZXR1cm4gZmFsc2VcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDln7rkuo4gdnhlLXRhYmxlIOihqOagvOeahOWinuW8uuaPkuS7tu+8jOaUr+aMgeWvvOWHuiB4bHN4IOagvOW8j1xyXG4gKi9cclxuZXhwb3J0IGNvbnN0IFZYRVRhYmxlUGx1Z2luRXhwb3J0WExTWDogYW55ID0ge1xyXG4gIGluc3RhbGwgKHh0YWJsZTogdHlwZW9mIFZYRVRhYmxlKSB7XHJcbiAgICBPYmplY3QuYXNzaWduKHh0YWJsZS50eXBlcywgeyB4bHN4OiAxIH0pXHJcbiAgICB4dGFibGUuaW50ZXJjZXB0b3IubWl4aW4oe1xyXG4gICAgICAnZXZlbnQuaW1wb3J0JzogaGFuZGxlSW1wb3J0RXZlbnQsXHJcbiAgICAgICdldmVudC5leHBvcnQnOiBoYW5kbGVFeHBvcnRFdmVudFxyXG4gICAgfSlcclxuICAgIFZYRVRhYmxlUGx1Z2luRXhwb3J0WExTWC50ID0geHRhYmxlLnRcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGkxOG4gKGtleTogc3RyaW5nKSB7XHJcbiAgaWYgKFZYRVRhYmxlUGx1Z2luRXhwb3J0WExTWC50KSB7XHJcbiAgICByZXR1cm4gVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYLnQoa2V5KVxyXG4gIH1cclxufVxyXG5cclxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5WWEVUYWJsZSkge1xyXG4gIHdpbmRvdy5WWEVUYWJsZS51c2UoVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYKVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBWWEVUYWJsZVBsdWdpbkV4cG9ydFhMU1hcclxuIl19
