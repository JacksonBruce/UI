
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Web;
using System.Web.Mvc;
using System.Reflection;

namespace jQuery.Fill.Controllers
{

    public class Book
    {
        public int ID { get; set; }
        public string Number { get; set; }
        public string Name { get; set; }
        public string Publisher { get; set; }
        public string Author { get; set; }
        public DateTime DateTime { get; set; }

        public static IEnumerable<Book> CreateList(int number)
        {
            if (number <= 0) { number = 10; }
            for (int i = 0; i < number; i++)
            {
                yield return new Book() { ID = i, Number = "00808" + i.ToString(), Author = "Author" + i, DateTime = DateTime.Now.AddHours(new Random(Guid.NewGuid().GetHashCode()).Next(100)*-1), Name = "BookName" + i, Publisher = "Publisher" + i };
            }
        }
    }
    

    public class PaginationController : Controller
    {
        IEnumerable<T> CreateOrderByQuery<T>(IQueryable<T> list, string sortExpression)
        {
            System.Diagnostics.Contracts.Contract.Requires(sortExpression != null);
            bool desc =(sortExpression= sortExpression.Trim()).EndsWith(" desc", StringComparison.OrdinalIgnoreCase);
            int len= sortExpression.LastIndexOf(' ');
            string sort = sortExpression.Substring(0, len < 0 ? sortExpression.Length : len);

            Type type = list.ElementType;
            var property = type.GetProperty(sort.Trim());
            var parameter = Expression.Parameter(type, string.Empty);
            var orderByExp = Expression.Lambda(Expression.MakeMemberAccess(parameter, property), parameter);
            MethodCallExpression resultExp = Expression.Call(typeof(Queryable)
                , desc ? "OrderByDescending" : "OrderBy"
                , new Type[] { type, property.PropertyType }
                , list.Expression, Expression.Quote(orderByExp));

            return list.Provider.CreateQuery<T>(resultExp);

        }
        // GET: Pagination
        public ActionResult Index(int pageSize = 10, int pageIndex = 0, string sortExpression=null)
        {
            //System.Threading.Thread.Sleep(1000);
            var data = Book.CreateList(100);
            var total = data.Count();

            if (!string.IsNullOrWhiteSpace(sortExpression))
            {
                data = CreateOrderByQuery<Book>(data.AsQueryable(), sortExpression);
            }
           

            //return Json(new { rows = new object[0], pager = new { } });
            return Json(new { rows = data.Skip(pageSize * pageIndex).Take(pageSize), pager = new { pageIndex = pageIndex, pageSize = pageSize, total, pageCount = total / pageSize + (total % pageSize > 0 ? 1 : 0) } });
        }
    }
}