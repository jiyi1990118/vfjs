import HTML2VDom from '../src/inside/utils/HTML2VDom';

window.onload=function () {
	let template=document.querySelector('script[type="text/vf-template"]').innerHTML;
	
	console.log(HTML2VDom(template));
}