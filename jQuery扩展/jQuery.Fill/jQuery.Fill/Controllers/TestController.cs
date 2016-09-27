using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace jQuery.Fill.Controllers
{
    public class Student {
        public string Name { get; set; }
        public string Number { get; set; }
        public DateTime Birthday { get; set; }
        public int ID { get; set; }
    }
    public class TestController : Controller
    {
        public ActionResult Get(Student entry)
        {
            return Json(new {
                mothed = nameof(Get),
                Request.HttpMethod
                ,
                entry
            }, JsonRequestBehavior.AllowGet);
        }
        public ActionResult Put(Student entry) {
           
            return Json(new { mothed=nameof(Put)
                ,
                 Request.HttpMethod
                ,
                entry }, JsonRequestBehavior.AllowGet);
        }
    }
}