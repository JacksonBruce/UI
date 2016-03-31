using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace jQuery.Fill.Controllers
{
    public class AsyncTestController : AsyncController
    {
        // GET: AsyncTest
        public ActionResult Test()
        {
            return View();
        }
        public async Task<ActionResult> Index()
        { 
        
            string dd = await Task.Run(()=>{
                Thread.Sleep(1000);
                return "hello world!";
               
        });

            return Content(dd);
        }
    }
}