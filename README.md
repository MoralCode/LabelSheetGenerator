# LabelSheetGenerator

![a screenshot of the LabelSheetGenerator webpage](_site/assets/media/webpage.png)

A little web tool that turns a series of pre-generated images of labels into a PDF that can be printed on sheet-style label paper, such as the kind sold by Avery and other brands. 

This was originally built as part of a pair of companion tools to assist with a large migration over to the open source [snipeIT](https://snipeitapp.com/) asset tracking tool, but can be used for other things tool. It was primarily designed for working with labels generated by [asset-labelmaker](https://github.com/MoralCode/asset-labelmaker), but should also work reasonably well with images generated by other means.

## Output

This tool generates PDFs that look something like this:

![a demonstration PDF showing many labels laid out in a sheet](_site/assets/media/demopdf.png)

This PDF was created in an attempt to showcase every feature of LabelSheetGenerator at once:
- skipping some number of labels at the start (for reusing/reprinting over half-printed sheets of labels)
- multiple label groups (to support multiple types/sizes of labels)
- ability to print multiple label images into one printed label (maximize efficiency by buying less different sized label sheets and cutting them yourself)
- printing borders (this is a debugging feature intended for those who want to develop layouts for new label types. It screws up the alignment of labels slightly due to the border widths and is only available if you run it yourself as that configuration data is stored with the label templates)


## Development environment

unless you already have a properly configured jekyll dev environment set up (in which case you can just serve the site locally that way), all you should need is docker.

The `start_devel_env.sh` script will start a docker container that serves the files from this repo as a local webserver so all you have to do is edit the files and refresh the page to see your changes.

## Supporting new label layouts
See [docs/adding-new-label-types.md](docs/adding-new-label-types.md) (also available to view on the website)
