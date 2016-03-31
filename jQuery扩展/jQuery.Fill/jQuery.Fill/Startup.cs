using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(jQuery.Fill.Startup))]
namespace jQuery.Fill
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
