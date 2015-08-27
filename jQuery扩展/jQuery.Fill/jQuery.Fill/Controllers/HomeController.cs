using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace jQuery.Fill.Controllers
{

    public class Aa {
        public int id { get; set; }
        public string name { get; set; }
        public DateTime CreateDate { get; set; }
    }
    public class KKK
    {
        public List<int> Ids { get; set; }
        public DateTime create { get; set; }
        public List<Aa> children { get; set; }
    }




    public class HomeController : Controller
    {
        public ActionResult Index()
        {




            return View();
        }

        public ActionResult Demo()
        {
           

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
        [System.Runtime.InteropServices.ComVisible(false)]
        public async Task<ActionResult> GetXml()
        {
            System.Net.WebClient wc = new System.Net.WebClient();

            var data = await wc.DownloadDataTaskAsync(new Uri("http://localhost:24762/PackageAPI/GetHealthAssessment?id=12&xpath=/data/Life"));

            return File(data, "text/xml");


        }
        public ActionResult getform()
        {
            return Json(new
            {
                Gender=true
                ,
                ID=1
                ,
                name = "jackson.bruce"
                ,
                title = "programmer"
                ,
                date = DateTime.Now
                ,
                book = new { ID=545, name = "jQuery", author ="Johbs" }
            });
        }

        public ActionResult getdata(int[] ids=null,int pageindex=0)
        {

            return Json(new
            {
                data = from n in new string[] { "jackson;tit;2014-12-25", "bruce;hass;2014-12-25 23:55:56", "jack;tit;2014-12-25", "elon;boss;2014-12-25" }
                       let arr = n.Split(';')
                       select new
                       {
                           name = arr[0],
                           title = arr[1],
                           date = Convert.ToDateTime(arr[2]).AddMinutes(DateTime.Now.Millisecond)
                           ,
                           books = from b in new string[] { "mvc 4.0;feng", "jQuery 10;Jonh" } let barr = b.Split(';') select new { name = barr[0], author = barr[1] }
                       }
                       ,
                pager = new { total = 33, index = pageindex, size = 10 }
            });



        }

        public ActionResult Test(int w, int h=0) {
           return Content("ok");

        }
        /// <summary>
        /// 模型绑定器测试
        /// </summary>
        /// <param name="entity"></param>
        /// <returns></returns>
        //public ActionResult post(KKK entity)
        //{
        //    //uint v=0xffffdb78;
        //    //int a = (int)v;
        //    //byte b = (byte)(a / 0x100);

        //    return Json(entity);
        //}

        public ActionResult post(int[] ids,DateTime create, List<Aa> children)
        {

            return Json(new { ids, create, children });
        }

        public ActionResult formPost(bool Gender, string name, string title, string date, int ID, Book book)
        {

            return Json(new { err=true,message="hhhh..." });
        }

        //public ActionResult Post(int[] ids)
        //{ 
        
        
        
        //}



        //public ActionResult getForm()
        //{
        //    return Json(new { Gender = true, name = "jackson", title = "a monkey", date = DateTime.Now, book = new Book() { Author = "bruce", DateTime = DateTime.Now.AddDays(-50), ID = 4554, Name = "JS", Number = "SN4545", Publisher = "SB" } });
        //}


        public ActionResult File(HttpPostedFileWrapper[] file, string name)
        {
            //return Content(name);
            return Content("{\"dd\":\"" + HttpUtility.JavaScriptStringEncode(name) + "\"}");

            //return Json(new { forms = Request.Form.Count, Request.Form, name=name, hasFile = file != null && file.Length > 0, FileName = file != null && file.Length > 0 ? file[0].FileName : string.Empty, ContentLength = file != null && file.Length > 0 ? file[0].ContentLength : 0 });
        
        }
    }
}